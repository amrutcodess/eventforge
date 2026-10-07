/**
 * A zero-dependency, in-memory token bucket.
 *
 * The assistant endpoint is reachable without authentication, because it lives on the public
 * marketing site. Without a limiter that is an open door to somebody else's quota.
 *
 * Two limits per key, and the split is the interesting part:
 *
 *   - **Soft** — the caller still gets HTTP 200, but served from the deterministic path
 *     instead of the model. The demo never shows an error; a user who clicks too fast just
 *     gets a slightly more mechanical (and still correct) answer.
 *   - **Hard** — HTTP 429. Reserved for genuine abuse, where a client is looping.
 *
 * Serverless caveat, stated plainly because it matters: each warm instance holds its own Map,
 * so these are per-instance limits, not a global quota. That is enough to stop a runaway
 * client from draining a free tier, which is the actual threat here. It is not a billing
 * guarantee, and the code should not be read as one.
 */

const buckets = new Map();
const MAX_KEYS = 5000;

/** Named tiers, so limits live in one place rather than at each call site. */
export const TIERS = {
  // Anonymous callers on the public site: a real conversation, then diminishing returns.
  assistantAnon: { soft: 10, hard: 40, windowMs: 60_000 },
  assistantAuthed: { soft: 30, hard: 120, windowMs: 60_000 },
  // Authenticated features that read a lot and may call the model with a large prompt.
  aiExpensive: { soft: 20, hard: 60, windowMs: 60_000 }
};

const keyFor = (req, name) => {
  const who = req.user?._id ? `u:${req.user._id}` : `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
  return `${name}:${who}`;
};

/**
 * @returns {{allowed:boolean, soft:boolean, retryAfter:number, remaining:number}}
 *   `soft: true` means "over the soft limit, serve the cheap path, do not error".
 */
export const checkLimit = (req, name, tier) => {
  const key = keyFor(req, name);
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + tier.windowMs };
    buckets.set(key, bucket);

    // Bound the Map on a long-lived instance. Deleting the first key is fine: entries are
    // re-created on demand and the cost of a lost counter is one extra allowed request.
    if (buckets.size > MAX_KEYS) {
      const oldest = buckets.keys().next().value;
      if (oldest !== undefined) buckets.delete(oldest);
    }
  }

  bucket.count += 1;
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count > tier.hard) {
    return { allowed: false, soft: false, retryAfter, remaining: 0 };
  }
  return {
    allowed: true,
    soft: bucket.count > tier.soft,
    retryAfter,
    remaining: Math.max(0, tier.soft - bucket.count)
  };
};

/**
 * Express middleware for the hard limit only. Endpoints that want the soft-limit behaviour
 * read `checkLimit` directly so they can serve their degraded answer instead of erroring.
 */
export const rateLimit = (name, tier) => (req, res, next) => {
  const state = checkLimit(req, name, tier);

  res.setHeader('X-RateLimit-Remaining', String(state.remaining));

  if (!state.allowed) {
    res.setHeader('Retry-After', String(state.retryAfter));
    return res.status(429).json({
      error: 'Too many requests. Please slow down and try again shortly.',
      retryAfter: state.retryAfter
    });
  }

  req.rateLimit = state;
  next();
};

/** Test hook. */
export const resetLimits = () => buckets.clear();
