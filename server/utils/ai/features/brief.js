import { askLLM } from '../provider.js';
import { llmOrFallback } from '../orchestrate.js';
import { loadEventBundle } from '../retrieval.js';
import { cacheGet, cacheSet } from '../cache.js';

/**
 * AI Event Brief — a plain-language summary of an event, shown at the top of its detail page.
 *
 * The only public, cached, model-backed endpoint, so it is the one where the deterministic
 * path matters most: it runs on every event page view for every visitor.
 *
 * Two guards on the model output. Highlights must name a session that actually exists — any
 * title that does not match a real session is dropped before the response is returned, so a
 * misbehaving model cannot put an invented session in front of a prospective attendee. And
 * the cache key carries `scope.level`, so a draft seen by staff never leaks into a cached
 * response served to the public.
 */

const summaryStats = (bundle) => {
  const { event, sessions, speakers, tickets } = bundle;

  const tracks = new Map();
  for (const s of sessions) {
    const name = s.track || 'General';
    if (!tracks.has(name)) tracks.set(name, { name, sessionCount: 0, speakers: new Set() });
    const entry = tracks.get(name);
    entry.sessionCount += 1;
    for (const sp of s.speakerIds || []) {
      if (sp && typeof sp === 'object' && sp.name) entry.speakers.add(sp.name);
    }
  }

  const days = new Set(sessions.map((s) => (s.startTime ? new Date(s.startTime).toISOString().slice(0, 10) : null)))
    .size;

  return {
    sessions: sessions.length,
    speakers: speakers.length,
    tracks: [...tracks.values()]
      .map((t) => ({ name: t.name, sessionCount: t.sessionCount, speakers: [...t.speakers] }))
      .sort((a, b) => b.sessionCount - a.sessionCount),
    ticketTiers: tickets.length,
    days: days || 1,
    capacity: sessions.reduce((sum, s) => sum + (s.capacity || 0), 0),
    confirmed: bundle.confirmedCount
  };
};

/** Rank highlights from the real programme. Returns `{ session, reason }` pairs. */
const rankHighlights = (bundle, stats, limit = 4) => {
  const { sessions } = bundle;
  if (!sessions.length) return [];

  const picks = [];
  const used = new Set();
  const add = (session, reason) => {
    if (!session || used.has(String(session._id))) return;
    used.add(String(session._id));
    picks.push({ title: session.title, reason, sessionId: String(session._id) });
  };

  const isKeynote = (s) => /keynote|opening|welcome|closing|fireside/i.test(s.title || '');

  // 1. The opening session, if the programme names one.
  add(
    sessions.find(isKeynote),
    'Flagship session — the one to plan your day around'
  );

  // 2. The largest room, as a proxy for the headline draw.
  const biggest = [...sessions].sort((a, b) => (b.capacity || 0) - (a.capacity || 0))[0];
  if (biggest && (biggest.capacity || 0) > 0) {
    add(biggest, `Largest room on the programme at ${biggest.capacity} seats`);
  }

  // 3. The session with the most speakers — usually a panel.
  const mostSpeakers = [...sessions].sort(
    (a, b) => (b.speakerIds?.length || 0) - (a.speakerIds?.length || 0)
  )[0];
  if ((mostSpeakers?.speakerIds?.length || 0) >= 2) {
    add(mostSpeakers, `Panel with ${mostSpeakers.speakerIds.length} speakers`);
  }

  // 4. The rarest track — a session in a track with the fewest sessions is the least likely
  //    to have a repeat, so it is the one worth flagging.
  const rarest = [...stats.tracks].reverse().find((t) => t.sessionCount >= 1);
  if (rarest) {
    const inTrack = sessions.find((s) => (s.track || 'General') === rarest.name);
    add(
      inTrack,
      rarest.sessionCount === 1
        ? `The only ${rarest.name} session on the programme`
        : `One of only ${rarest.sessionCount} in the ${rarest.name} track`
    );
  }

  for (const s of sessions) {
    if (picks.length >= limit) break;
    add(s, `${s.track || 'General'} track, ${s.roomName}`);
  }

  return picks.slice(0, limit);
};

/** Assemble a summary from computed facts. No model, and no canned sentences. */
const deterministicBrief = (bundle, stats) => {
  const { event, tickets } = bundle;

  const parts = [
    `${event.title} is a ${event.category} running ${new Date(event.startDate).toISOString().slice(0, 10)} to ${new Date(event.endDate).toISOString().slice(0, 10)}.`
  ];

  if (event.tagline) parts.push(event.tagline);

  if (stats.sessions > 0) {
    parts.push(
      `The programme has ${stats.sessions} session${stats.sessions !== 1 ? 's' : ''} across ` +
        `${stats.tracks.length} track${stats.tracks.length !== 1 ? 's' : ''} over ${stats.days} day${stats.days !== 1 ? 's' : ''}, ` +
        `with ${stats.speakers} speaker${stats.speakers !== 1 ? 's' : ''}.`
    );
    if (stats.tracks.length) {
      const lead = stats.tracks[0];
      // "carries the most sessions (1)" is technically true and reads like a machine wrote it.
      // When the programme is too thin for a lead track to be meaningful, name the tracks
      // instead of inventing a hierarchy between them.
      if (lead.sessionCount === 1) {
        const names = stats.tracks.map((t) => t.name);
        parts.push(
          `Sessions span ${names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`}, ` +
            `one of each.`
        );
      } else {
        parts.push(
          `"${lead.name}" carries the most sessions (${lead.sessionCount})` +
            (stats.tracks[1] ? `, alongside ${stats.tracks[1].name} and ${stats.tracks.length - 2 > 0 ? `${stats.tracks.length - 2} more` : 'the remainder'}.` : '.')
        );
      }
    }
  } else {
    parts.push('The session programme has not been published yet.');
  }

  if (tickets.length) {
    const cheapest = tickets[0];
    parts.push(
      `Tickets start at $${cheapest.price}` +
        ` across ${tickets.length} tier${tickets.length !== 1 ? 's' : ''}` +
        `${stats.confirmed ? `, with ${stats.confirmed} attendees already confirmed.` : '.'}`
    );
  }

  return { summary: parts.join(' '), highlights: rankHighlights(bundle, stats) };
};

export async function buildEventBrief({ eventId, scope }) {
  const bundle = await loadEventBundle(eventId, scope);
  if (!bundle) return null;

  const stats = summaryStats(bundle);

  // Fingerprinted on the shape of the programme rather than the clock, so adding a session
  // invalidates the cache immediately instead of waiting for the TTL.
  const fingerprint = [
    stats.sessions,
    stats.speakers,
    stats.ticketTiers,
    bundle.event.updatedAt ? new Date(bundle.event.updatedAt).getTime() : 'na'
  ].join(':');
  const cacheKey = `brief:${eventId}:${scope.level}:${fingerprint}`;

  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  const sessionList = bundle.sessions
    .slice(0, 25)
    .map(
      (s) =>
        `- ${s.title} | track: ${s.track || 'General'} | room: ${s.roomName} | ` +
        `${new Date(s.startTime).toISOString().slice(0, 16).replace('T', ' ')} | ` +
        `capacity ${s.capacity || 0} | speakers: ${(s.speakerIds || []).map((p) => p?.name).filter(Boolean).join(', ') || 'none'}`
    )
    .join('\n');

  const result = await llmOrFallback({
    feature: 'brief',
    primary: () =>
      askLLM({
        json: true,
        temperature: 0.4,
        maxTokens: 700,
        system:
          'You write briefs for prospective conference attendees. You return only JSON.',
        user:
          `Using ONLY the facts below, return JSON:\n` +
          `{"summary": "<= 60 words, one paragraph", "highlights": [{"title": "<exact session title copied from the list>", "reason": "<= 12 words"}]}\n\n` +
          `Rules: 3-4 highlights. Each "title" MUST be copied verbatim from the SESSION list. Never invent a session, speaker or number. If there are no sessions, return an empty highlights array.\n\n` +
          `EVENT: ${bundle.event.title} — ${bundle.event.category}, ${new Date(bundle.event.startDate).toISOString().slice(0, 10)} to ${new Date(bundle.event.endDate).toISOString().slice(0, 10)}.\n` +
          `${bundle.event.tagline || ''}\n\n` +
          `STATS: ${stats.sessions} sessions, ${stats.speakers} speakers, ${stats.tracks.length} tracks, ${stats.ticketTiers} ticket tiers.\n\n` +
          `SESSIONS:\n${sessionList || '(none published)'}\n\n` +
          `TICKETS: ${bundle.tickets.map((t) => `${t.name} $${t.price}`).join(', ') || 'none'}`
      }),
    fallback: () => deterministicBrief(bundle, stats)
  });

  const fallbackShape = deterministicBrief(bundle, stats);
  const value = result.value || fallbackShape;

  // Drop any highlight naming a session that does not exist. This is the anti-hallucination
  // gate — the model does not get to invent programme items.
  const realTitles = new Set(bundle.sessions.map((s) => s.title));
  const highlights = (Array.isArray(value.highlights) ? value.highlights : [])
    .filter((h) => h && typeof h.title === 'string' && realTitles.has(h.title))
    .slice(0, 5);

  const payload = {
    summary: typeof value.summary === 'string' && value.summary.trim() ? value.summary : fallbackShape.summary,
    highlights: highlights.length ? highlights : fallbackShape.highlights,
    tracks: stats.tracks,
    stats,
    source: result.source,
    degraded: result.degraded,
    cached: false
  };

  cacheSet(cacheKey, payload, 5 * 60_000);
  return payload;
}
