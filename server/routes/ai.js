import express from 'express';
import { z } from 'zod';
import { protect, optionalAuth } from '../middleware/auth.js';
import { requireEventRole } from '../middleware/eventAuth.js';
import { rateLimit, checkLimit, TIERS } from '../middleware/rateLimit.js';
import { resolveScope, scopeAllowsEvent } from '../utils/ai/visibility.js';
import { answerAssistant } from '../utils/ai/features/assistant.js';
import { buildEventBrief } from '../utils/ai/features/brief.js';
import { buildAgenda } from '../utils/ai/features/agenda.js';
import { buildInsights } from '../utils/ai/features/insights.js';
import { writeDraft } from '../utils/ai/features/draft.js';
import { recommendSessionsForAttendee } from '../utils/aiService.js';
import { Session } from '../models/Session.js';
import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';

/**
 * AI routes.
 *
 * Two of the six are public, and that is deliberate — the assistant and the event brief live on
 * the marketing site, so a visitor meets them before creating an account. Neither reads a single
 * privileged field: every retrieval path goes through `resolveScope`, which decides visibility
 * from the caller's actual role rather than from anything the caller says about themselves.
 *
 * The other four require a token, and the insights route additionally requires an organizer or
 * staff role on that specific event.
 */

const router = express.Router();

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const badRequest = (res, message) => res.status(400).json({ error: message });

/** Shared shape for the two endpoints that accept free text. */
const assistantSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(500),
  eventId: z.string().regex(OBJECT_ID).nullish(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000)
      })
    )
    .max(12)
    .optional()
});

const draftSchema = z.object({
  type: z.enum(['event_description', 'speaker_bio', 'session_summary', 'announcement']),
  title: z.string().trim().min(1, 'Title is required').max(200),
  keywords: z.string().max(300).optional(),
  context: z.string().max(1000).optional(),
  eventId: z.string().regex(OBJECT_ID).nullish()
});

/**
 * POST /api/ai/assistant — the Forge Assistant. Public.
 *
 * Rate limiting is done here rather than via the `rateLimit` middleware because this endpoint
 * needs *both* halves of the tier: the middleware can only reject, and the soft limit needs to
 * change how the answer is produced. Calling `checkLimit` once (not twice, under two names —
 * that would silently create two independent buckets) gives the count, and `state.soft` becomes
 * `allowLlm: false`, so an over-soft caller gets the deterministic answer instead of an error.
 */
router.post('/assistant', optionalAuth, async (req, res, next) => {
  try {
    const parsed = assistantSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return badRequest(res, parsed.error.issues[0]?.message || 'Invalid request');
    }

    const { message, history, eventId } = parsed.data;

    const tier = req.user ? TIERS.assistantAuthed : TIERS.assistantAnon;
    const state = checkLimit(req, 'assistant', tier);
    res.setHeader('X-RateLimit-Remaining', String(state.remaining));

    if (!state.allowed) {
      res.setHeader('Retry-After', String(state.retryAfter));
      return res.status(429).json({
        error: 'Too many requests. Please slow down and try again shortly.',
        retryAfter: state.retryAfter
      });
    }

    const scope = await resolveScope(req, eventId || null);

    const result = await answerAssistant({
      message,
      history: history || [],
      eventId: eventId || null,
      scope,
      allowLlm: !state.soft
    });

    res.json({
      ...result,
      // Present only when the caller crossed the soft limit, so the client can say
      // "showing a shorter answer" rather than silently pretending nothing changed.
      throttled: state.soft || undefined
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ai/event-brief/:eventId — summary, highlights and tracks for an event page. Public.
 *
 * Cached by a fingerprint of the underlying data, so a popular event page does not re-invoke the
 * model on every view.
 */
router.get('/event-brief/:eventId', optionalAuth, rateLimit('brief', TIERS.aiExpensive), async (req, res, next) => {
  try {
    const { eventId } = req.params;
    if (!OBJECT_ID.test(String(eventId))) return badRequest(res, 'A valid event id is required.');

    const scope = await resolveScope(req, eventId);
    const brief = await buildEventBrief({ eventId, scope });

    // null covers both "no such event" and "not visible to you", and the response is identical
    // for the same reason: a different status for a draft event would leak that it exists.
    if (!brief) return res.status(404).json({ error: 'Event not found' });

    res.json(brief);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/build-agenda — a conflict-free personal schedule. Authenticated.
 *
 * The selection is a weighted interval-scheduling DP over real sessions; the model only writes
 * the rationale prose. An LLM cannot guarantee non-overlap or return ids that exist, so it is
 * not asked to. `save: true` writes the result to the caller's own registration.
 */
router.post('/build-agenda', protect, rateLimit('agenda', TIERS.aiExpensive), async (req, res, next) => {
  try {
    const { eventId, interests, save } = req.body || {};
    if (!OBJECT_ID.test(String(eventId || ''))) return badRequest(res, 'A valid eventId is required.');

    const safeInterests = (Array.isArray(interests) ? interests : [])
      .map((i) => String(i).trim())
      .filter(Boolean)
      .slice(0, 12);

    const scope = await resolveScope(req, eventId);
    const result = await buildAgenda({ eventId, interests: safeInterests, scope });
    if (!result) return res.status(404).json({ error: 'Event not found' });

    let saved = false;
    let saveError = null;

    if (save) {
      const registration = await Registration.findOne({ eventId, attendeeId: req.user._id });
      if (!registration) {
        saveError = 'no_registration';
      } else {
        // Re-validate every session id against this event before writing. The ids came from our
        // own DP so they should all be valid, but a write path should never trust its input
        // just because of where it came from.
        const ids = result.agenda.map((item) => item.sessionId);
        const valid = await Session.find({ _id: { $in: ids }, eventId }).select('_id').lean();
        registration.attendeeSelections = valid.map((s) => s._id);
        await registration.save();
        saved = true;
      }
    }

    res.json({ ...result, saved, saveError });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ai/insights/:eventId — narrative read of an event's analytics.
 *
 * The most tightly guarded AI route, because it is the only one whose inputs are inherently
 * private. It sits behind the same role check the analytics endpoints use, and the model itself
 * is only handed aggregate stats and already-computed findings — never a name, an email or a
 * feedback comment.
 */
router.get(
  '/insights/:eventId',
  protect,
  requireEventRole(['organizer', 'staff']),
  rateLimit('insights', TIERS.aiExpensive),
  async (req, res, next) => {
    try {
      const insights = await buildInsights({ eventId: req.params.eventId });
      if (!insights) return res.status(404).json({ error: 'Event not found' });
      res.json(insights);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/ai/draft-content — copywriting. Authenticated.
 *
 * `eventId` is optional but transformative: without it the draft is composed from the title
 * alone, with it the copy is grounded in the event's real venue, dates, tracks and speakers.
 * The old route accepted a `context` field that no caller ever sent; this one is wired to actual
 * records instead.
 */
router.post('/draft-content', protect, rateLimit('draft', TIERS.aiExpensive), async (req, res, next) => {
  try {
    const parsed = draftSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return badRequest(res, parsed.error.issues[0]?.message || 'Type and Title are required');
    }

    const { type, title, keywords, context, eventId } = parsed.data;
    const scope = eventId ? await resolveScope(req, eventId) : null;

    const result = await writeDraft({ type, title, keywords, context, eventId, scope });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/recommend-sessions — interest-matched sessions for an attendee. Authenticated.
 */
router.post('/recommend-sessions', protect, rateLimit('recommend', TIERS.aiExpensive), async (req, res, next) => {
  try {
    const { eventId, userInterests } = req.body || {};
    if (!OBJECT_ID.test(String(eventId || ''))) return badRequest(res, 'A valid eventId is required.');

    const interests = (Array.isArray(userInterests) ? userInterests : null) ||
      (Array.isArray(req.user.interests) && req.user.interests.length ? req.user.interests : ['Technology']);

    // Visibility is resolved first. This route previously fetched sessions for any `eventId`
    // the caller supplied, which meant a stranger could read the session list of an unpublished
    // event by guessing its id — the same leak `resolveScope` exists to close.
    const scope = await resolveScope(req, eventId);
    const event = await Event.findById(eventId).select('status').lean();
    if (!scopeAllowsEvent(scope, event)) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const sessions = await Session.find({ eventId })
      .populate('speakerIds', 'name title company photoUrl')
      .lean();

    if (!sessions.length) {
      return res.json({ recommended: [], source: 'fallback', degraded: false });
    }

    const recommended = await recommendSessionsForAttendee(interests, sessions);
    res.json({ recommended });
  } catch (err) {
    next(err);
  }
});

export default router;
