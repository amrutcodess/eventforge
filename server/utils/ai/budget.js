/**
 * Character-based budgeting for prompts.
 *
 * There is no tokenizer here on purpose. Pulling in tiktoken (or a per-provider equivalent)
 * would add a large dependency whose only job is to make an estimate marginally more precise.
 * `chars / 4` is the standard rule of thumb for English text and is accurate enough for a
 * HARD CAP — which is all this is used for. The goal is "a pathological query cannot build a
 * 40k-token prompt", not exact accounting.
 */

/**
 * Coerce to a string, treating null and undefined as empty.
 *
 * `String(null)` is `"null"` and `String(undefined)` is `"undefined"` — both non-empty, both
 * able to survive a truthiness check and end up quoted into a prompt as if a user had typed
 * them. A default parameter does not help, because it only fires for `undefined`. Every entry
 * point into this module goes through here so that never happens.
 */
const asText = (s) => (s === null || s === undefined ? '' : String(s));

/** Rough token estimate. Used for logging and ceilings, never for billing. */
export const estTokens = (s = '') => Math.ceil(asText(s).length / 4);

/** Truncate to `max` characters, appending an ellipsis when something was dropped. */
export const clampChars = (s = '', max) => {
  const text = asText(s);
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
};

/** ~1500 tokens of retrieved context. The retrieval layer stops adding records at this point. */
export const CTX_BUDGET_CHARS = 6000;

/** Conversation window sent back to the model. Bounded on turns, per-message, and in total. */
export const HISTORY_TURNS = 6;
export const HISTORY_CHARS_EACH = 800;
export const HISTORY_CHARS_TOTAL = 3000;

/** A single user message longer than this is a prompt-stuffing attempt, not a question. */
export const MESSAGE_MAX_CHARS = 500;
