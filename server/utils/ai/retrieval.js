import { Event } from '../../models/Event.js';
import { Session } from '../../models/Session.js';
import { Speaker } from '../../models/Speaker.js';
import { TicketCategory } from '../../models/TicketCategory.js';
import { Registration } from '../../models/Registration.js';
import { clampChars, CTX_BUDGET_CHARS } from './budget.js';

/**
 * Retrieval — "RAG-lite", and the description is deliberately literal.
 *
 * This is **lexical retrieval with weighted field scoring over live Mongo documents**. There
 * are no embeddings, no vector store and no semantic similarity: a query for "cheap food
 * nearby" will not match a session called "Catering Logistics" unless the words overlap.
 *
 * That is a considered trade rather than a shortcut. An embedding index needs a model load,
 * a build step and a warm cache — all of which fight a serverless cold start — and it would
 * cost a network round trip before the assistant could say anything. Keyword scoring over
 * the live collection is instant, always current, and costs nothing.
 *
 * It is also what makes the *fallback* path real. With no LLM configured, these renderers
 * are the entire answer, so they have to produce something a person would actually be happy
 * to read. Every string below is built from a real record.
 *
 * Invariant enforced by every function here: the caller's `scope` filters the queries.
 * Nothing in this file may run an unfiltered `Event.find()`.
 */

const isObjectId = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);

// UTC-based and deterministic on purpose. Local formatting would make the same event render
// differently depending on which region a serverless instance happened to land in.
const dayKey = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const clock = (d) => (d ? new Date(d).toISOString().slice(11, 16) : '');
const money = (n, currency = 'USD') =>
  `${currency === 'USD' ? '$' : ''}${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const speakerNamesOf = (s) =>
  (s.speakerIds || []).map((sp) => (typeof sp === 'object' ? sp.name : null)).filter(Boolean);

// ── Loading ──────────────────────────────────────────────────────────────────────────────

/**
 * Everything an event-scoped answer could need, in one round of queries.
 * Returns `null` when the event does not exist *or* is not visible in this scope — the two
 * cases are intentionally indistinguishable to the caller, so a public request cannot use
 * the difference to probe for the existence of a draft.
 */
export async function loadEventBundle(eventId, scope) {
  if (!isObjectId(eventId)) return null;

  const event = await Event.findOne({ _id: eventId, ...scope.statusFilter })
    .populate('venueId')
    .populate('orgId', 'name logo website')
    .lean();
  if (!event) return null;

  const [sessions, speakers, tickets, confirmed] = await Promise.all([
    Session.find({ eventId })
      .populate('speakerIds', 'name title company topicTags')
      .sort({ startTime: 1 })
      .limit(200)
      .lean(),
    Speaker.find({ eventId }).limit(200).lean(),
    TicketCategory.find({ eventId }).sort({ price: 1 }).limit(50).lean(),
    // countDocuments only. Registration rows carry names, emails and QR tokens, and a public
    // scope must never read one. Keep this a count.
    Registration.countDocuments({ eventId, status: 'confirmed' })
  ]);

  const venue = event.venueId && typeof event.venueId === 'object' ? event.venueId : null;

  return { event, sessions, speakers, tickets, venue, confirmedCount: confirmed };
}

/** Published/ongoing events visible in this scope. */
export async function loadEventList(scope, { limit = 12 } = {}) {
  return Event.find(scope.statusFilter)
    .select('title slug tagline category startDate endDate tags bannerImage themeColor venueId')
    .populate('venueId', 'name city country')
    .sort({ startDate: 1 })
    .limit(limit)
    .lean();
}

// ── Renderers ────────────────────────────────────────────────────────────────────────────
// Each returns `{ text, sources }`. Refs are stable within one rendered block so the model
// can cite `[S3]` and the client can turn it back into a link.

export function renderEventContext(bundle, { sessionLimit = 25, speakerLimit = 15 } = {}) {
  const { event, sessions, speakers, tickets, venue, confirmedCount } = bundle;
  const sources = [];
  const lines = [];

  sources.push({
    ref: 'E1',
    type: 'event',
    id: String(event._id),
    label: event.title,
    meta: { category: event.category, startDate: event.startDate, slug: event.slug }
  });

  lines.push(
    `[E1] ${event.title} — ${event.category}, ${dayKey(event.startDate)} to ${dayKey(event.endDate)}, status "${event.status}".`
  );
  if (event.tagline) lines.push(`Tagline: ${event.tagline}`);
  if (event.description) lines.push(`Description: ${clampChars(event.description, 700)}`);
  if (event.tags?.length) lines.push(`Topics: ${event.tags.join(', ')}`);
  lines.push(`Confirmed registrations: ${confirmedCount}.`);

  if (venue) {
    sources.push({
      ref: 'V1',
      type: 'venue',
      id: String(venue._id),
      label: venue.name,
      meta: { city: venue.city }
    });
    const rooms = (venue.rooms || [])
      .map((r) => `${r.name} (capacity ${r.capacity}${r.layout ? `, ${r.layout}` : ''})`)
      .join('; ');
    lines.push(
      `[V1] Venue: ${venue.name}, ${venue.address || ''} ${venue.city || ''} ${venue.country || ''}.`.trim()
    );
    if (rooms) lines.push(`Rooms: ${rooms}`);
  } else {
    lines.push('Venue: not yet announced.');
  }

  if (tickets.length) {
    lines.push('', 'TICKETS:');
    tickets.forEach((t, i) => {
      const ref = `T${i + 1}`;
      const remaining = Math.max(0, (t.capacity || 0) - (t.quantitySold || 0));
      sources.push({
        ref,
        type: 'ticket',
        id: String(t._id),
        label: t.name,
        meta: { price: t.price, currency: t.currency, remaining }
      });
      lines.push(
        `[${ref}] ${t.name} — ${money(t.price, t.currency)} — capacity ${t.capacity}, ` +
          `${t.quantitySold} sold, ${remaining} remaining` +
          `${t.requiresApproval ? ' — requires approval' : ''}.`
      );
    });
  } else {
    lines.push('', 'TICKETS: none published yet.');
  }

  if (sessions.length) {
    lines.push('', 'SESSIONS:');
    sessions.slice(0, sessionLimit).forEach((s, i) => {
      const ref = `S${i + 1}`;
      const names = speakerNamesOf(s);
      sources.push({
        ref,
        type: 'session',
        id: String(s._id),
        label: s.title,
        meta: { track: s.track, room: s.roomName, startTime: s.startTime, endTime: s.endTime }
      });
      lines.push(
        `[${ref}] ${dayKey(s.startTime)} ${clock(s.startTime)}-${clock(s.endTime)} — ${s.title} ` +
          `— track: ${s.track || 'General'} — room: ${s.roomName}` +
          `${names.length ? ` — speakers: ${names.join(', ')}` : ''}` +
          `${s.summary ? ` — ${clampChars(s.summary, 160)}` : ''}`
      );
    });
    if (sessions.length > sessionLimit) {
      lines.push(`…and ${sessions.length - sessionLimit} more sessions.`);
    }
  } else {
    lines.push('', 'SESSIONS: the schedule has not been published yet.');
  }

  if (speakers.length) {
    lines.push('', 'SPEAKERS:');
    speakers.slice(0, speakerLimit).forEach((sp, i) => {
      const ref = `P${i + 1}`;
      sources.push({
        ref,
        type: 'speaker',
        id: String(sp._id),
        label: sp.name,
        meta: { title: sp.title, company: sp.company }
      });
      lines.push(
        `[${ref}] ${sp.name} — ${sp.title || 'Speaker'}${sp.company ? ` at ${sp.company}` : ''}` +
          `${sp.topicTags?.length ? ` — topics: ${sp.topicTags.join(', ')}` : ''}`
      );
    });
  }

  return { text: clampChars(lines.join('\n'), CTX_BUDGET_CHARS), sources };
}

export function renderPricing(bundle) {
  const { tickets } = bundle;
  if (!tickets.length) return 'No ticket tiers have been published for this event yet.';
  return tickets
    .map((t) => {
      const remaining = Math.max(0, (t.capacity || 0) - (t.quantitySold || 0));
      const state = remaining <= 0 ? 'sold out' : `${remaining} of ${t.capacity} remaining`;
      return `${t.name} is ${money(t.price, t.currency)} — ${state}${
        t.requiresApproval ? ', and requires organizer approval' : ''
      }.`;
    })
    .join(' ');
}

export function renderSchedule(bundle, { limit = 12 } = {}) {
  const { sessions } = bundle;
  if (!sessions.length) return 'The schedule for this event has not been published yet.';

  const byDay = new Map();
  for (const s of sessions) {
    const key = dayKey(s.startTime);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(s);
  }

  const out = [];
  let shown = 0;
  for (const [day, list] of byDay) {
    if (shown >= limit) break;
    out.push(`${day}:`);
    for (const s of list) {
      if (shown >= limit) {
        out.push(`  …and ${sessions.length - shown} more.`);
        break;
      }
      const names = speakerNamesOf(s);
      out.push(
        `  ${clock(s.startTime)}-${clock(s.endTime)} — ${s.title} (${s.track || 'General'}, ${s.roomName})` +
          `${names.length ? ` — ${names.join(', ')}` : ''}`
      );
      shown += 1;
    }
  }
  return out.join('\n');
}

export function renderSpeakers(bundle, { limit = 10 } = {}) {
  const { speakers } = bundle;
  if (!speakers.length) return 'No speakers have been announced for this event yet.';
  return speakers
    .slice(0, limit)
    .map(
      (sp) =>
        `${sp.name} — ${sp.title || 'Speaker'}${sp.company ? ` at ${sp.company}` : ''}` +
        `${sp.topicTags?.length ? ` (${sp.topicTags.join(', ')})` : ''}`
    )
    .join('\n');
}

export function renderVenue(bundle) {
  const { venue, event } = bundle;
  if (!venue) return `The venue for ${event.title} has not been announced yet.`;
  const rooms = (venue.rooms || [])
    .map((r) => `${r.name} (capacity ${r.capacity})`)
    .join(', ');
  return (
    `${event.title} is held at ${venue.name}, ${venue.address || ''} ${venue.city || ''} ` +
    `${venue.country || ''}.`.replace(/\s+/g, ' ').trim() + (rooms ? ` Rooms: ${rooms}.` : '')
  );
}

/** Suggested follow-ups, derived from which data actually exists. Never generic filler. */
export function buildSuggestions(bundle) {
  const out = [];
  if (bundle.sessions.length) out.push(`What's on the schedule for ${bundle.event.title}?`);
  if (bundle.tickets.length) out.push('How much are tickets?');
  if (bundle.speakers.length) out.push('Who is speaking?');
  if (bundle.venue) out.push('Where is it being held?');
  out.push('How do I register?');
  return out.slice(0, 4);
}

// ── Keyword search ───────────────────────────────────────────────────────────────────────

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'was', 'were',
  'what', 'when', 'where', 'who', 'whom', 'how', 'do', 'does', 'did', 'can', 'could', 'i',
  'my', 'me', 'it', 'its', 'this', 'that', 'these', 'those', 'with', 'at', 'be', 'been',
  'will', 'would', 'there', 'any', 'some', 'about', 'from', 'by', 'as', 'if', 'you', 'your'
]);

export const tokenize = (q = '') =>
  String(q)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP.has(t))
    .slice(0, 24);

// Field weights per document type. Higher = a match there is a stronger signal.
const WEIGHTS = {
  event: { title: 5, tags: 4, tagline: 3, category: 3, description: 1 },
  session: { title: 5, track: 4, summary: 3, speakerNames: 2, description: 1, roomName: 1 },
  speaker: { name: 5, topicTags: 4, title: 2, company: 2, bio: 1 }
};

const scoreDoc = (terms, fields, weights, rawQuery, titleText) => {
  let score = 0;
  for (const [field, weight] of Object.entries(weights)) {
    const value = String(fields[field] || '').toLowerCase();
    if (!value) continue;
    for (const term of terms) {
      if (!value.includes(term)) continue;
      // A whole-word hit is worth full weight; a substring hit is weaker. "ai" matching
      // "chair" is the case this guards against.
      score += new RegExp(`\\b${term}\\b`).test(value) ? weight : weight * 0.5;
    }
  }
  // The literal query phrase appearing in the title is the strongest signal available.
  if (rawQuery.length >= 4 && titleText.toLowerCase().includes(rawQuery)) score += 6;
  return score;
};

/**
 * Score across events, sessions and speakers.
 *
 * @returns {Promise<{items:Array, sources:Array, text:string}>}
 */
export async function searchCorpus({ query, scope, eventId = null, limit = 6 }) {
  const terms = tokenize(query);
  const rawQuery = String(query || '').toLowerCase().trim();

  // When an event is named, retrieval is confined to it; otherwise it spans everything the
  // scope can see, joined through the events that scope returned.
  let eventIds = null;
  let events;
  if (eventId && isObjectId(eventId)) {
    events = await Event.find({ _id: eventId, ...scope.statusFilter })
      .select('title tagline description category tags startDate status slug')
      .lean();
    eventIds = events.map((e) => e._id);
  } else {
    events = await Event.find(scope.statusFilter)
      .select('title tagline description category tags startDate status slug')
      .sort({ startDate: 1 })
      .limit(200)
      .lean();
    eventIds = events.map((e) => e._id);
  }

  if (!eventIds.length) return { items: [], sources: [], text: 'No events are available.' };

  const [sessions, speakers] = await Promise.all([
    Session.find({ eventId: { $in: eventIds } })
      .populate('speakerIds', 'name topicTags company')
      .limit(200)
      .lean(),
    Speaker.find({ eventId: { $in: eventIds } }).limit(200).lean()
  ]);

  const candidates = [];

  for (const e of events) {
    candidates.push({
      kind: 'event',
      doc: e,
      title: e.title,
      sortKey: e.startDate,
      score: scoreDoc(
        terms,
        {
          title: e.title,
          tags: (e.tags || []).join(' '),
          tagline: e.tagline,
          category: e.category,
          description: e.description
        },
        WEIGHTS.event,
        rawQuery,
        e.title
      )
    });
  }

  for (const s of sessions) {
    candidates.push({
      kind: 'session',
      doc: s,
      title: s.title,
      sortKey: s.startTime,
      score: scoreDoc(
        terms,
        {
          title: s.title,
          track: s.track,
          summary: s.summary,
          description: s.description,
          speakerNames: speakerNamesOf(s).join(' '),
          roomName: s.roomName
        },
        WEIGHTS.session,
        rawQuery,
        s.title
      )
    });
  }

  for (const sp of speakers) {
    candidates.push({
      kind: 'speaker',
      doc: sp,
      title: sp.name,
      sortKey: null,
      score: scoreDoc(
        terms,
        {
          name: sp.name,
          topicTags: (sp.topicTags || []).join(' '),
          title: sp.title,
          company: sp.company,
          bio: sp.bio
        },
        WEIGHTS.speaker,
        rawQuery,
        sp.name
      )
    });
  }

  // Stable ordering: score, then time, then id. Determinism matters because these same
  // records become citation refs — an unstable sort would give the same question different
  // sources on different requests.
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const at = a.sortKey ? new Date(a.sortKey).getTime() : Infinity;
    const bt = b.sortKey ? new Date(b.sortKey).getTime() : Infinity;
    if (at !== bt) return at - bt;
    return String(a.doc._id).localeCompare(String(b.doc._id));
  });

  let picked = candidates.filter((c) => c.score > 0).slice(0, limit);

  // A question with no lexical overlap ("hi", "tell me more") must not produce an empty
  // context — fall back to the most relevant-by-recency items instead.
  if (!picked.length) picked = candidates.slice(0, limit);

  const sources = [];
  const lines = picked.map((c, i) => {
    const ref = `R${i + 1}`;
    if (c.kind === 'event') {
      sources.push({
        ref,
        type: 'event',
        id: String(c.doc._id),
        label: c.doc.title,
        meta: { slug: c.doc.slug, startDate: c.doc.startDate, category: c.doc.category }
      });
      return `[${ref}] Event: ${c.doc.title} — ${c.doc.category}, ${dayKey(c.doc.startDate)} — ${clampChars(c.doc.tagline || c.doc.description || '', 180)}`;
    }
    if (c.kind === 'session') {
      sources.push({
        ref,
        type: 'session',
        id: String(c.doc._id),
        label: c.doc.title,
        meta: { track: c.doc.track, room: c.doc.roomName, startTime: c.doc.startTime }
      });
      return `[${ref}] Session: ${c.doc.title} — ${c.doc.track || 'General'} — ${dayKey(c.doc.startTime)} ${clock(c.doc.startTime)} — ${c.doc.roomName}${c.doc.summary ? ` — ${clampChars(c.doc.summary, 160)}` : ''}`;
    }
    sources.push({
      ref,
      type: 'speaker',
      id: String(c.doc._id),
      label: c.doc.name,
      meta: { title: c.doc.title, company: c.doc.company }
    });
    return `[${ref}] Speaker: ${c.doc.name} — ${c.doc.title || ''}${c.doc.company ? ` at ${c.doc.company}` : ''}${c.doc.topicTags?.length ? ` — topics: ${c.doc.topicTags.join(', ')}` : ''}`;
  });

  return {
    items: picked.map((c) => ({ kind: c.kind, score: c.score, doc: c.doc })),
    sources,
    text: clampChars(lines.join('\n'), CTX_BUDGET_CHARS)
  };
}
