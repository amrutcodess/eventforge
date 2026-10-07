/**
 * A tiny TTL + LRU cache, module scope.
 *
 * This exists so the event brief — the one AI endpoint that is public, cached and read on
 * every event page view — does not call the model once per visitor.
 *
 * On serverless this is per-instance and dies with a cold start. That is fine and
 * deliberate: it is a latency and cost optimisation, never a correctness mechanism. Nothing
 * cached here is data a caller would be wrong to see, because the key includes the caller's
 * visibility level (see the `scope.level` segment in the brief key).
 */

const store = new Map();
const MAX_ENTRIES = 60;

export const cacheGet = (key) => {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  // Refresh recency for the LRU eviction below.
  store.delete(key);
  store.set(key, hit);
  return hit.value;
};

export const cacheSet = (key, value, ttlMs = 5 * 60_000) => {
  if (store.size >= MAX_ENTRIES) {
    // Map preserves insertion order, and cacheGet re-inserts on read, so the first key is
    // the least recently used.
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
};

export const cacheClear = () => store.clear();
