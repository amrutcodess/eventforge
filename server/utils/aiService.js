import { writeDraft } from './ai/features/draft.js';
import { askLLM } from './ai/provider.js';
import { llmOrFallback } from './ai/orchestrate.js';
import { interestScore } from './ai/scheduler.js';

/**
 * Facade over the AI layer, kept because two callers predate it: `routes/ai.js` and the
 * `test_system.js` suite. Both signatures are unchanged — `generateAIDraft` returns a string,
 * `recommendSessionsForAttendee` returns an array of session objects — so nothing that
 * already depends on this file needed to be touched.
 *
 * New code should import from `utils/ai/*` directly and get the richer envelope (source,
 * degraded) that these two cannot express without breaking their contract.
 */

/**
 * @returns {Promise<string>} The draft copy itself.
 */
export const generateAIDraft = async ({ type, title, keywords, context, eventId, scope } = {}) => {
  const { draft } = await writeDraft({ type, title, keywords, context, eventId, scope });
  return draft;
};

/** Interest-weighted ranking over whatever the caller supplied. */
const rankByInterests = (interests, sessions, limit = 4) => {
  if (!interests.length) return sessions.slice(0, 3);
  return sessions
    .map((session) => ({ session, score: interestScore(session, interests) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.session);
};

/**
 * @returns {Promise<Array>} Session objects, most relevant first.
 */
export const recommendSessionsForAttendee = async (attendeeInterests = [], availableSessions = []) => {
  if (!Array.isArray(availableSessions) || availableSessions.length === 0) return [];

  const interests = (Array.isArray(attendeeInterests) ? attendeeInterests : [])
    .map((i) => String(i).trim())
    .filter(Boolean);

  const result = await llmOrFallback({
    feature: 'recommend',
    primary: async () => {
      const asked = await askLLM({
        json: true,
        temperature: 0.3,
        maxTokens: 300,
        system: 'You rank conference sessions for an attendee. You return only JSON.',
        user:
          `An attendee is interested in: [${interests.join(', ') || 'no stated interests'}].\n\n` +
          `Available sessions:\n` +
          availableSessions
            .map(
              (s) =>
                `- id: ${s._id} | title: ${s.title} | track: ${s.track || 'General'} | ` +
                `summary: ${String(s.summary || '').slice(0, 160)} | ` +
                // `track` and the speaker topics are the real signal here. The previous
                // version of this prompt sent `s.tags`, but Session has no tags field, so it
                // was always undefined and the model was ranking on title alone.
                `speakers: ${(s.speakerIds || []).map((p) => (typeof p === 'object' ? p?.name : '')).filter(Boolean).join(', ') || 'none'}`
            )
            .join('\n') +
          `\n\nReturn the 3-5 most relevant session ids as JSON: {"sessionIds": ["<id>", "<id>"]}`
      });

      if (!asked.ok) return asked;

      // The prompt asks for an object with a named key. The previous version asked for a bare
      // array while setting response_format to json_object, which requires an object — so the
      // model was being given contradictory instructions.
      const ids = asked.data?.sessionIds;
      if (!Array.isArray(ids) || ids.length === 0) return { ok: false, reason: 'unusable' };
      return asked;
    },
    fallback: () => rankByInterests(interests, availableSessions)
  });

  if (result.source === 'llm') {
    const byId = new Map(availableSessions.map((s) => [String(s._id), s]));
    const picked = (result.value?.sessionIds || []).map((id) => byId.get(String(id))).filter(Boolean);
    if (picked.length) return picked;
  }

  return rankByInterests(interests, availableSessions);
};
