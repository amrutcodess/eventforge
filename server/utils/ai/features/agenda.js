import { askLLM } from '../provider.js';
import { llmOrFallback } from '../orchestrate.js';
import { loadEventBundle } from '../retrieval.js';
import { buildConflictFreeAgenda, seatsFillFast } from '../scheduler.js';

/**
 * AI Agenda Builder.
 *
 * The one feature where `degraded: true` is the normal state rather than a compromise. The
 * selection is a dynamic program over real sessions (see utils/ai/scheduler.js) because it
 * has to be provably conflict-free; the model's only job is to write a sentence about the
 * result. With no model configured the agenda is exactly as correct — the rationale is just
 * a little more mechanical.
 *
 * Saving reuses the validation already in `PUT /api/events/:eventId/my-sessions` — only
 * session ids that belong to this event are ever written — so a crafted id cannot be
 * persisted.
 */

const shapeItem = (session, allSessions) => ({
  sessionId: String(session._id),
  title: session.title,
  summary: session.summary || '',
  track: session.track || 'General',
  roomName: session.roomName,
  startTime: session.startTime,
  endTime: session.endTime,
  capacity: session.capacity,
  speakers: (session.speakerIds || [])
    .filter((s) => s && typeof s === 'object')
    .map((s) => ({ name: s.name, company: s.company || '', title: s.title || '' })),
  seatsFillFast: seatsFillFast(session, allSessions)
});

const hhmm = (d) => new Date(d).toISOString().slice(11, 16);

/** Rationale written from the actual selection — every clause is a fact about the result. */
const deterministicRationale = ({ stats, tracks, interests }) => {
  if (stats.selected === 0) {
    return 'No sessions could be scheduled — the programme for this event has not been published yet.';
  }

  const parts = [
    `Built a conflict-free agenda of ${stats.selected} session${stats.selected !== 1 ? 's' : ''} ` +
      `from ${stats.candidates} candidate${stats.candidates !== 1 ? 's' : ''}, covering ${stats.totalMinutes} minutes across ${tracks.length} track${tracks.length !== 1 ? 's' : ''}.`
  ];

  if (interests.length) {
    parts.push(`Weighted toward ${interests.join(', ')}.`);
  } else {
    parts.push('No interests were supplied, so this maximises coverage of the programme.');
  }

  if (stats.skippedConflicts > 0) {
    parts.push(
      `${stats.skippedConflicts} session${stats.skippedConflicts !== 1 ? 's were' : ' was'} left out to avoid overlapping a higher-relevance pick.`
    );
  } else {
    parts.push('Nothing had to be dropped for a clash.');
  }

  return parts.join(' ');
};

export async function buildAgenda({ eventId, interests = [], scope, minGapMinutes = 0 }) {
  const bundle = await loadEventBundle(eventId, scope);
  if (!bundle) return null;

  const { picked, stats } = buildConflictFreeAgenda(bundle.sessions, interests, { minGapMinutes });

  const agenda = picked.map((s) => shapeItem(s, bundle.sessions));
  const tracks = [...new Set(agenda.map((a) => a.track))];

  const summaryForModel = agenda
    .map(
      (a, i) =>
        `${i + 1}. ${hhmm(a.startTime)}-${hhmm(a.endTime)} — ${a.title} (${a.track}, ${a.roomName})`
    )
    .join('\n');

  const result = await llmOrFallback({
    feature: 'agenda',
    primary: () =>
      askLLM({
        temperature: 0.5,
        maxTokens: 260,
        system: 'You write short, warm, specific rationale notes for conference attendees.',
        user:
          `The attendee is interested in: ${interests.length ? interests.join(', ') : 'no stated interests'}.\n` +
          `Their conflict-free agenda for "${bundle.event.title}" is:\n${summaryForModel}\n\n` +
          `Write a 2-3 sentence rationale. Mention how many sessions and which tracks. ` +
          `Do not claim anything that is not in the list above. Plain text, no lists or headings.`
      }),
    fallback: () => deterministicRationale({ stats, tracks, interests })
  });

  return {
    agenda,
    rationale: typeof result.value === 'string' ? result.value : deterministicRationale({ stats, tracks, interests }),
    stats,
    event: { id: String(bundle.event._id), title: bundle.event.title, slug: bundle.event.slug },
    source: result.source,
    degraded: result.degraded
  };
}
