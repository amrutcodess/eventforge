import OpenAI from 'openai';

/**
 * The single place in the server that talks to an LLM.
 *
 * Provider-agnostic by construction: OpenAI, Groq, OpenRouter and a local Ollama all speak
 * the same `chat.completions` shape, so switching between them is a `baseURL` change rather
 * than adapter code. Nothing here branches on hostname.
 *
 * Env is read lazily rather than captured at module scope. `app.js` does import
 * `dotenv/config` first (see the comment at the top of that file), but depending on import
 * ordering for correctness is a trap that has already bitten this codebase once — a lazy
 * read cannot be broken by it.
 *
 * Every export here is total: nothing throws. A caller gets an envelope describing what
 * happened and decides whether to fall back.
 */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const env = () => ({
  baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  // OPENAI_API_KEY is still honoured so an existing deployment keeps working untouched.
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '',
  model: process.env.AI_MODEL || 'gpt-4o-mini',
  // Clamped. This function's maxDuration on Vercel is 30s, and Mongo plus serialization
  // need room after the model returns; 20s is the ceiling, 1.5s the floor.
  timeoutMs: clamp(num(process.env.AI_TIMEOUT_MS, 8000), 1500, 20000),
  maxTokens: clamp(num(process.env.AI_MAX_OUTPUT_TOKENS, 900), 64, 4000),
  jsonMode: process.env.AI_JSON_MODE || 'auto',
  breakerFails: clamp(num(process.env.AI_BREAKER_FAILS, 4), 1, 50),
  breakerCooldownMs: clamp(num(process.env.AI_BREAKER_COOLDOWN_MS, 60000), 1000, 600000),
  debug: process.env.AI_DEBUG === 'true',
});

export const aiEnabled = () => Boolean(env().apiKey);

/** Provider + model, for a status line in the UI. Never includes the key. */
export const aiDescriptor = () => {
  const e = env();
  return { enabled: Boolean(e.apiKey), model: e.model, baseURL: e.baseURL, timeoutMs: e.timeoutMs };
};

// ── Client: built on first use, cached against the env tuple it was built for ────────────
let _client = null;
let _clientKey = null;

const getClient = () => {
  const e = env();
  if (!e.apiKey) return null;

  const key = `${e.baseURL}|${e.apiKey}|${e.model}`;
  if (_client && _clientKey === key) return _client;

  // maxRetries: 0 deliberately. The SDK default of 2 means a hung provider costs three
  // sequential timeouts, which on a 30s serverless budget is the difference between a
  // degraded answer and a dead request.
  _client = new OpenAI({ apiKey: e.apiKey, baseURL: e.baseURL, maxRetries: 0 });
  _clientKey = key;
  return _client;
};

// ── Circuit breaker ──────────────────────────────────────────────────────────────────────
// Module scope, so it survives warm invocations on the same instance and resets on a cold
// start. That is the right granularity: it exists to stop a *dead provider* from being
// retried on every request, not to meter normal traffic.
//
// This is also the cost-safety mechanism. Once the endpoint is failing, every feature takes
// its deterministic path with zero outbound calls, so a broken provider cannot burn the
// free tier's quota or the demo's wall-clock.
const breaker = { fails: 0, openedAt: 0 };

const breakerOpen = () => {
  if (!breaker.openedAt) return false;
  if (Date.now() - breaker.openedAt > env().breakerCooldownMs) {
    breaker.fails = 0;
    breaker.openedAt = 0;
    return false;
  }
  return true;
};

const recordFailure = () => {
  breaker.fails += 1;
  if (breaker.fails >= env().breakerFails) breaker.openedAt = Date.now();
};

const recordSuccess = () => {
  breaker.fails = 0;
  breaker.openedAt = 0;
};

export const breakerState = () => ({
  open: breakerOpen(),
  fails: breaker.fails
});

// ── Timeout ──────────────────────────────────────────────────────────────────────────────
/**
 * Race the call against a timer. The SDK's own per-request `timeout` is passed too, so a
 * well-behaved provider aborts early and this is only the backstop for one that ignores it.
 * The timer is cleared on settle — an outstanding `setTimeout` keeps the Node process alive
 * and would delay a serverless instance from freezing.
 */
const withTimeout = (promise, ms, label) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`AI_TIMEOUT:${label}:${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const classify = (message = '') => {
  if (/AI_TIMEOUT/.test(message)) return 'timeout';
  if (/401|403|invalid_api_key|Unauthorized/i.test(message)) return 'auth';
  if (/429|rate limit/i.test(message)) return 'rate_limited';
  if (/ECONNREFUSED|ENOTFOUND|fetch failed|socket hang up/i.test(message)) return 'unreachable';
  return 'provider_error';
};

// ── The one call site ────────────────────────────────────────────────────────────────────
/**
 * Ask the model. Never throws.
 *
 * @returns {Promise<{ok:false, reason:string, ms:number} | {ok:true, text:string, data?:any, ms:number}>}
 */
export async function askLLM({ system, user, json = false, maxTokens, temperature = 0.4 }) {
  const e = env();
  const client = getClient();

  if (!client) return { ok: false, reason: 'no_key', ms: 0 };
  if (breakerOpen()) return { ok: false, reason: 'breaker', ms: 0 };

  const started = Date.now();

  try {
    const request = {
      model: e.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature,
      max_tokens: Math.min(maxTokens || e.maxTokens, e.maxTokens)
    };

    // `jsonMode: none` exists for providers with weak or absent structured-output support.
    // When the flag is off the prompt still asks for JSON; only the enforcement is dropped,
    // and a bad parse degrades rather than throws.
    if (json && e.jsonMode !== 'none') {
      request.response_format = { type: 'json_object' };
    }

    const res = await withTimeout(
      client.chat.completions.create(request, { timeout: e.timeoutMs }),
      e.timeoutMs + 500,
      'chat'
    );

    const text = res?.choices?.[0]?.message?.content?.trim() || '';
    if (!text) {
      recordFailure();
      return { ok: false, reason: 'empty', ms: Date.now() - started };
    }

    if (json) {
      try {
        const data = JSON.parse(text);
        recordSuccess();
        return { ok: true, text, data, ms: Date.now() - started };
      } catch {
        // A model that wrapped JSON in prose is common enough to be worth surviving.
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const data = JSON.parse(match[0]);
            recordSuccess();
            return { ok: true, text, data, ms: Date.now() - started };
          } catch {
            /* fall through */
          }
        }
        recordFailure();
        return { ok: false, reason: 'bad_json', ms: Date.now() - started };
      }
    }

    recordSuccess();
    return { ok: true, text, ms: Date.now() - started };
  } catch (err) {
    recordFailure();
    const reason = classify(err?.message || '');
    if (e.debug) {
      // Host and model only — never the prompt, never the key.
      console.warn(`[ai] ${reason} (${e.baseURL} ${e.model}): ${err?.message}`);
    }
    return { ok: false, reason, ms: Date.now() - started };
  }
}
