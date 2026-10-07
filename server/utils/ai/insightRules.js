/**
 * The insight rules.
 *
 * These are the product. Each rule is a pure function over `loadInsightsData` output that
 * returns an insight or `null`. They run with or without an LLM configured — the optional
 * model pass only reorders and rephrases what is already here, and cannot invent a finding,
 * because the structured `insights[]` array ships alongside the narrative. If the prose ever
 * contradicted a rule, the rule would still be sitting next to it, correct.
 *
 * Every rule carries `refs` pointing at real session and ticket ids so the dashboard can
 * deep-link to the thing being described.
 */

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);
const overlap = (a, b) =>
  new Date(a.startTime) < new Date(b.endTime) && new Date(a.endTime) > new Date(b.startTime);
const withinDays = (date, days) => {
  const diff = new Date(date).getTime() - Date.now();
  return diff > 0 && diff <= days * 86_400_000;
};
const isPast = (date) => new Date(date).getTime() < Date.now();

/** Pairs of items sharing a key whose time ranges overlap. */
const overlappingPairs = (items, keyFn) => {
  const pairs = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (keyFn(items[i]) !== keyFn(items[j])) continue;
      if (overlap(items[i], items[j])) pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
};

export const RULES = [
  // ── Scheduling integrity ───────────────────────────────────────────────────────────────
  ({ sessions, rooms }) => {
    if (!rooms.length) return null;
    const roomCapacity = new Map(rooms.map((r) => [r.name, r.capacity]));
    const bad = sessions.filter(
      (s) => roomCapacity.has(s.roomName) && Number.isFinite(s.capacity) && s.capacity > roomCapacity.get(s.roomName)
    );
    if (!bad.length) return null;
    const worst = bad[0];
    return {
      id: 'room_over_capacity',
      severity: 'high',
      title: `${bad.length} session${bad.length > 1 ? 's are' : ' is'} booked into a room too small`,
      detail:
        `"${worst.title}" expects ${worst.capacity} attendees but ${worst.roomName} holds ` +
        `${roomCapacity.get(worst.roomName)}. Attendees will be turned away.`,
      refs: bad.slice(0, 5).map((s) => ({ type: 'session', id: s.id, label: s.title }))
    };
  },

  ({ sessions }) => {
    const pairs = overlappingPairs(sessions, (s) => s.roomName);
    if (!pairs.length) return null;
    const [a, b] = pairs[0];
    return {
      id: 'room_double_booked',
      severity: 'high',
      title: `${pairs.length} room double-booking${pairs.length > 1 ? 's' : ''}`,
      detail: `"${a.title}" and "${b.title}" are both scheduled in ${a.roomName} at overlapping times.`,
      refs: [
        { type: 'session', id: a.id, label: a.title },
        { type: 'session', id: b.id, label: b.title }
      ]
    };
  },

  ({ sessions }) => {
    // Same track, overlapping times — a delegate cannot attend both, so one is wasted
    // regardless of which room it is in.
    const pairs = overlappingPairs(sessions, (s) => s.track);
    if (!pairs.length) return null;
    const [a, b] = pairs[0];
    return {
      id: 'track_time_clash',
      severity: 'medium',
      title: `${pairs.length} clash${pairs.length > 1 ? 'es' : ''} within a single track`,
      detail:
        `Two "${a.track}" sessions overlap: "${a.title}" and "${b.title}". ` +
        `Attendees following that track must choose one.`,
      refs: [
        { type: 'session', id: a.id, label: a.title },
        { type: 'session', id: b.id, label: b.title }
      ]
    };
  },

  // ── Session demand ─────────────────────────────────────────────────────────────────────
  ({ sessions }) => {
    const busy = sessions.filter(
      (s) => s.capacity > 0 && s.attendance / s.capacity > 0.9 && s.attendance > 0
    );
    if (!busy.length) return null;
    const top = busy.sort((a, b) => b.attendance / b.capacity - a.attendance / a.capacity)[0];
    return {
      id: 'session_oversubscribed',
      severity: 'high',
      title: `"${top.title}" is at ${pct(top.attendance, top.capacity)}% capacity`,
      detail:
        `${top.attendance} attendees checked in against ${top.capacity} seats. ` +
        `Consider a repeat run or a larger room.`,
      refs: busy.slice(0, 5).map((s) => ({ type: 'session', id: s.id, label: s.title }))
    };
  },

  ({ sessions }) => {
    const quiet = sessions.filter(
      (s) => isPast(s.startTime) && s.capacity > 0 && s.attendance / s.capacity < 0.2
    );
    if (!quiet.length) return null;
    const sample = quiet[0];
    return {
      id: 'session_undersubscribed',
      severity: 'low',
      title: `${quiet.length} past session${quiet.length > 1 ? 's' : ''} ran under 20% full`,
      detail: `"${sample.title}" drew ${sample.attendance} of ${sample.capacity} seats. Worth reviewing the track split.`,
      refs: quiet.slice(0, 5).map((s) => ({ type: 'session', id: s.id, label: s.title }))
    };
  },

  // ── Ticketing ──────────────────────────────────────────────────────────────────────────
  ({ tickets }) => {
    const hot = tickets.filter((t) => t.capacity > 0 && t.quantitySold / t.capacity > 0.9);
    if (!hot.length) return null;
    const top = hot.sort((a, b) => b.quantitySold / b.capacity - a.quantitySold / a.capacity)[0];
    return {
      id: 'ticket_near_sellout',
      severity: 'medium',
      title: `${hot.length} ticket tier${hot.length > 1 ? 's are' : ' is'} nearly sold out`,
      detail: `"${top.name}" is at ${pct(top.quantitySold, top.capacity)}% (${top.quantitySold}/${top.capacity}). Open another tier or raise capacity.`,
      refs: hot.map((t) => ({ type: 'ticket', id: t.id, label: t.name }))
    };
  },

  ({ tickets, event }) => {
    const slow = tickets.filter(
      (t) => t.capacity > 0 && t.quantitySold / t.capacity < 0.3 && t.price > 0
    );
    if (!slow.length || !withinDays(event.startDate, 14)) return null;
    const top = slow[0];
    return {
      id: 'ticket_overstocked',
      severity: 'medium',
      title: 'Paid tiers are underselling close to the event',
      detail:
        `"${top.name}" has sold ${top.quantitySold} of ${top.capacity} with under two weeks to go. ` +
        `A coupon or a reminder to registrants may recover it.`,
      refs: slow.map((t) => ({ type: 'ticket', id: t.id, label: t.name }))
    };
  },

  ({ tickets, registrations }) => {
    // A waitlist while seats are demonstrably free is the clearest sign something is stuck.
    if (registrations.waitlisted === 0) return null;
    const room = tickets.find((t) => t.capacity > t.quantitySold);
    if (!room) return null;
    return {
      id: 'waitlist_contradiction',
      severity: 'high',
      title: `${registrations.waitlisted} attendee${registrations.waitlisted > 1 ? 's are' : ' is'} waitlisted while seats remain`,
      detail: `"${room.name}" still has ${room.capacity - room.quantitySold} seats free. Promotion is not running.`,
      refs: [{ type: 'ticket', id: room.id, label: room.name }]
    };
  },

  ({ tickets }) => {
    const total = tickets.reduce((s, t) => s + t.revenue, 0);
    if (total <= 0) return null;
    const top = [...tickets].sort((a, b) => b.revenue - a.revenue)[0];
    if (top.revenue / total < 0.6) return null;
    return {
      id: 'revenue_concentration',
      severity: 'low',
      title: `${pct(top.revenue, total)}% of revenue comes from one tier`,
      detail: `"${top.name}" accounts for $${Math.round(top.revenue).toLocaleString()} of $${Math.round(total).toLocaleString()}. That is a single point of failure.`,
      refs: [{ type: 'ticket', id: top.id, label: top.name }]
    };
  },

  // ── Attendance and sentiment ───────────────────────────────────────────────────────────
  ({ registrations, event }) => {
    if (!['ongoing', 'completed'].includes(event.status)) return null;
    if (registrations.confirmed === 0) return null;
    const rate = pct(registrations.checkedIn, registrations.confirmed);
    if (rate >= 60) return null;
    return {
      id: 'checkin_gap',
      severity: 'medium',
      title: `Only ${rate}% of confirmed attendees have checked in`,
      detail: `${registrations.checkedIn} of ${registrations.confirmed} confirmed registrations have been scanned in.`,
      refs: []
    };
  },

  ({ registrations }) => {
    if (registrations.avgRating === null || registrations.feedbackCount < 5) return null;
    if (registrations.avgRating >= 3.5) return null;
    return {
      id: 'feedback_risk',
      severity: 'high',
      title: `Attendee satisfaction is ${registrations.avgRating}/5`,
      detail: `Across ${registrations.feedbackCount} responses. Below 3.5 usually means an operational problem, not a content one.`,
      refs: []
    };
  },

  ({ registrations, event }) => {
    if (event.status !== 'completed' || registrations.feedbackCount > 0) return null;
    return {
      id: 'feedback_silent',
      severity: 'low',
      title: 'The event closed without collecting any feedback',
      detail: 'Zero ratings submitted. Add a feedback prompt to the post-event email while the event is still fresh.',
      refs: []
    };
  },

  ({ timeline }) => {
    if (timeline.length < 4) return null;
    const now = Date.now();
    const inWindow = (from, to) =>
      timeline
        .filter((d) => {
          const t = new Date(d.date).getTime();
          return t >= now - from * 86_400_000 && t < now - to * 86_400_000;
        })
        .reduce((s, d) => s + d.registrations, 0);

    const recent = inWindow(7, 0);
    const prior = inWindow(14, 7);
    if (prior < 3) return null;

    const change = Math.round(((recent - prior) / prior) * 100);
    if (Math.abs(change) < 40) return null;

    return {
      id: 'registration_velocity',
      severity: change < 0 ? 'medium' : 'low',
      title: `Registrations ${change < 0 ? 'down' : 'up'} ${Math.abs(change)}% week on week`,
      detail: `${recent} in the last 7 days against ${prior} the week before.`,
      refs: []
    };
  },

  ({ sessions }) => {
    if (sessions.length < 5) return null;
    const counts = sessions.reduce((acc, s) => {
      acc[s.track] = (acc[s.track] || 0) + 1;
      return acc;
    }, {});
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (entries.length < 2) return null;
    const [topTrack, topCount] = entries[0];
    const share = pct(topCount, sessions.length);
    if (share < 60) return null;
    return {
      id: 'track_imbalance',
      severity: 'low',
      title: `${share}% of the programme sits in one track`,
      detail: `"${topTrack}" has ${topCount} of ${sessions.length} sessions. The programme may read as narrower than the event's stated topics.`,
      refs: []
    };
  }
];

/** Run every rule. A rule that throws is skipped — it must not take down the endpoint. */
export function evaluateRules(data) {
  const order = { high: 0, medium: 1, low: 2 };
  const found = [];

  for (const rule of RULES) {
    try {
      const insight = rule(data);
      if (insight) found.push(insight);
    } catch (err) {
      if (process.env.AI_DEBUG === 'true') console.warn('[ai] insight rule threw:', err?.message);
    }
  }

  return found.sort((a, b) => order[a.severity] - order[b.severity]);
}
