/**
 * The one ergonomic every AI feature uses: declare an LLM path and a deterministic path,
 * and let this decide which ran.
 *
 * The contract that matters is in the return shape. `source` and `degraded` travel to the
 * client, so the UI can label an answer honestly — "AI-drafted" versus "composed from this
 * event's data" — instead of either lying or showing an error. A degraded response is a
 * normal, expected outcome here, not a failure.
 */

/**
 * @param {object}   spec
 * @param {string}   spec.feature   Name, used only for logging.
 * @param {Function} spec.primary   Returns `{ ok: true, data | text }` or `{ ok: false, reason }`.
 * @param {Function} spec.fallback  Receives the failure reason. MUST succeed — it is the answer.
 * @returns {Promise<{value:any, source:'llm'|'fallback', degraded:boolean, reason?:string}>}
 */
export async function llmOrFallback({ feature, primary, fallback }) {
  let result = { ok: false, reason: 'not_attempted' };

  try {
    result = await primary();
  } catch (err) {
    // A `primary` that throws is a bug in the feature, not a provider failure. Swallow it
    // rather than letting an optional enhancement take down a request that has a perfectly
    // good deterministic answer waiting.
    result = { ok: false, reason: 'primary_threw' };
    if (process.env.AI_DEBUG === 'true') {
      console.warn(`[ai] ${feature} primary threw:`, err?.message);
    }
  }

  if (result?.ok) {
    return {
      value: result.data !== undefined ? result.data : result.text,
      source: 'llm',
      degraded: false
    };
  }

  const value = await fallback(result?.reason || 'unknown');
  const reason = result?.reason || 'unknown';

  return {
    value,
    source: 'fallback',
    // `degraded` means "AI was available to this deployment and did not serve this response" —
    // a breaker trip, a timeout, a provider error. It deliberately excludes `no_key`: a
    // deployment with no key configured is not degraded, it is simply deterministic, and
    // labelling every answer there as degraded would train users to ignore the flag. The
    // `reason` still travels either way, so nothing is hidden from a client that cares.
    degraded: reason !== 'no_key',
    reason
  };
}
