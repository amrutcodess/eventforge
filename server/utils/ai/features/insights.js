import { askLLM } from '../provider.js';
import { llmOrFallback } from '../orchestrate.js';
import { loadInsightsData } from '../../analyticsData.js';
import { evaluateRules } from '../insightRules.js';

/**
 * AI Insights for the organizer dashboard.
 *
 * The only AI route that is never public: it necessarily reasons over registration, revenue
 * and feedback data, so it sits behind the same `requireEventRole(['organizer','staff'])`
 * guard the analytics endpoints use.
 *
 * Order of operations matters. The rule engine runs first and produces the findings; the model
 * is then handed those findings and asked only to phrase them. It never sees raw registration
 * rows, attendee names, emails or feedback comments — only aggregate stats and the already
 * computed insight objects. And because the structured `insights[]` array ships alongside the
 * narrative, a model that wandered off would be contradicted by the data next to it.
 */

const severityRank = { high: 0, medium: 1, low: 2 };

/**
 * The recommended next step for each rule, keyed by rule id.
 *
 * A lookup rather than a ternary chain: there are fourteen rules, and the chain silently fell
 * through to "Review the flagged items below." for every one it did not name — which was most
 * of them. The fallback survives for a rule added without an entry here.
 */
const ACTIONS = {
  room_over_capacity: 'Move the affected sessions to a larger room, or cap registration at the room capacity.',
  room_double_booked: 'Reassign one of the two sessions — the room is booked twice at the same time.',
  track_time_clash: 'Stagger the start times so attendees can reach both sessions in the track.',
  session_oversubscribed: 'Consider a repeat run or a larger room for the affected session.',
  session_undersubscribed: 'Promote the affected sessions, or merge them into a better-attended slot.',
  ticket_near_sellout: 'Prepare a waitlist and confirm the room capacity matches demand.',
  ticket_overstocked: 'Run a coupon or a reminder to registrants — inventory is outrunning demand.',
  waitlist_contradiction: 'Promote from the waitlist — seats are being held unnecessarily.',
  revenue_concentration: 'Diversify the ticket mix; revenue resting on one tier is fragile.',
  checkin_gap: 'Chase the outstanding confirmations — a low check-in rate usually means a reminder was missed.',
  feedback_risk: 'Review the feedback comments directly; the rating pattern usually points at logistics rather than content.',
  feedback_silent: 'Prompt attendees for feedback while the event is still fresh.',
  registration_velocity: 'Watch the pace — the recent surge may affect catering and room capacity.',
  track_imbalance: 'Rebalance the programme; one track is carrying the schedule.'
};

const deterministicNarrative = (insights, stats, event) => {
  if (!insights.length) {
    return (
      `No anomalies detected across ${stats.sessions} session${stats.sessions !== 1 ? 's' : ''} and ` +
      `${stats.confirmed} confirmed registration${stats.confirmed !== 1 ? 's' : ''}. ` +
      (stats.confirmed === 0
        ? 'There is not much activity to analyse yet.'
        : 'Capacity, ticketing and scheduling all look consistent.')
    );
  }

  const [top, ...rest] = insights;
  const parts = [`${top.title}. ${top.detail}`];

  if (rest.length) {
    const alsoHigh = rest.filter((r) => r.severity === 'high').length;
    parts.push(
      `${rest.length} further finding${rest.length !== 1 ? 's were' : ' was'} logged` +
        (alsoHigh ? `, including ${alsoHigh} at high severity.` : '.')
    );
  }

  parts.push(`Priority: ${ACTIONS[top.id] || 'Review the flagged items below.'}`);

  return parts.join(' ');
};

export async function buildInsights({ eventId }) {
  const data = await loadInsightsData(eventId);
  if (!data) return null;

  const insights = evaluateRules(data);

  const stats = {
    sessions: data.sessions.length,
    confirmed: data.registrations.confirmed,
    checkedIn: data.registrations.checkedIn,
    waitlisted: data.registrations.waitlisted,
    revenue: Math.round(data.registrations.revenue),
    avgRating: data.registrations.avgRating,
    feedbackCount: data.registrations.feedbackCount,
    checkInRate:
      data.registrations.confirmed > 0
        ? Math.round((data.registrations.checkedIn / data.registrations.confirmed) * 100)
        : 0
  };

  // A compact, PII-free projection. Note there is no name, email or comment text here —
  // deliberately, and the shape of this object is the guard.
  const findings = insights.map((i) => ({
    id: i.id,
    severity: i.severity,
    title: i.title,
    detail: i.detail
  }));

  const result = await llmOrFallback({
    feature: 'insights',
    primary: () =>
      askLLM({
        temperature: 0.4,
        maxTokens: 300,
        system:
          'You are an event operations analyst. You summarise already-computed findings for an organizer.',
        user:
          `Write a 3-4 sentence narrative for the organizer of "${data.event.title}": what is healthy, ` +
          `what needs attention, and the single most urgent action. Do not invent findings or numbers. ` +
          `Do not mention attendee names. Plain text, no headings.\n\n` +
          `STATS: ${JSON.stringify(stats)}\n\n` +
          `FINDINGS (all already verified as true):\n${JSON.stringify(findings, null, 1)}`
      }),
    fallback: () => deterministicNarrative(insights, stats, data.event)
  });

  return {
    narrative:
      typeof result.value === 'string' ? result.value : deterministicNarrative(insights, stats, data.event),
    insights: insights.map((i) => ({ ...i, severityRank: severityRank[i.severity] ?? 3 })),
    stats,
    source: result.source,
    degraded: result.degraded
  };
}
