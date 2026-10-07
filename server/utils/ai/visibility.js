import { getEventPermissions } from '../../middleware/eventAuth.js';

/**
 * Visibility scoping — the backbone every AI retrieval path runs through.
 *
 * The rule this file exists to enforce: **no AI feature may query an event without going
 * through `resolveScope` first.** The rest of the server is looser than the AI layer needs
 * to be — `GET /api/events/:slugOrId` will happily return a `draft`, and the session and
 * ticket sub-routes do not check status at all. An assistant that reads those same queries
 * would happily answer a stranger's questions about an unpublished event, so the scope is
 * re-derived here rather than inherited.
 *
 * A caller-supplied `eventId` is never trusted. It is re-resolved through
 * `getEventPermissions`, which is the same check the rest of the app uses — so the AI layer
 * can never show anyone more than the app itself would.
 */

export const PUBLIC_EVENT_STATUS = ['published', 'ongoing'];

const isObjectId = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);

/** A scope that sees only published/ongoing events. */
const publicScope = () => ({
  level: 'public',
  statusFilter: { status: { $in: PUBLIC_EVENT_STATUS } },
  eventId: null
});

/**
 * @param {object} req                 Express request (reads `req.user` only).
 * @param {string} [requestedEventId]  Untrusted id from the query string or body.
 * @returns {Promise<{level:'public'|'staff', statusFilter:object, eventId:string|null}>}
 */
export async function resolveScope(req, requestedEventId) {
  const userId = req.user?._id || null;

  // Anonymous is anonymous. There is no token, no role, and no widening path.
  if (!userId) return publicScope();

  if (!isObjectId(requestedEventId)) return publicScope();

  try {
    const perms = await getEventPermissions(userId, requestedEventId);
    if (perms?.event && (perms.canManage || perms.canStaff)) {
      return {
        level: 'staff',
        statusFilter: { _id: perms.event._id },
        eventId: String(perms.event._id)
      };
    }
  } catch {
    // A malformed or missing event falls back to public visibility rather than erroring —
    // the caller still gets a useful answer about published events.
  }

  return publicScope();
}

/** True when the scope is allowed to see `event` (a document or lean object). */
export const scopeAllowsEvent = (scope, event) => {
  if (!event) return false;
  // A staff scope is pinned to one event the caller manages, and drafts are the point.
  if (scope.level === 'staff') return true;
  return PUBLIC_EVENT_STATUS.includes(event.status);
};
