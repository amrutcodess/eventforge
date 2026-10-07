import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { useAssistantContext } from '../../context/AssistantContext';

/**
 * The Forge Assistant — the public face of the AI layer.
 *
 * Mounted once in `App` so it exists on every route, and reachable without an account, because
 * it sits on the marketing site. Three consequences shaped it:
 *
 *   1. **It answers from live records, not from the model's memory.** Every reply carries the
 *      sources it was built from, and those are rendered underneath. When the deployment has no
 *      API key the answers come from the deterministic path in the server — still drawn from the
 *      real event, still cited. The "grounded" line in the footer is a claim the UI can back up.
 *   2. **It degrades instead of erroring.** Over the soft rate limit the server returns HTTP 200
 *      with a shorter, deterministic answer and a `throttled` flag; the panel says so quietly
 *      rather than showing a failure.
 *   3. **It is non-modal.** No scroll lock and no focus trap — a support panel that hijacks the
 *      page is worse than one you can ignore. `Esc` closes it, focus lands on the input when it
 *      opens and returns to the launcher when it closes.
 */

const DEFAULT_SUGGESTIONS = ['What events are available?', 'How do I register?'];

const AssistantMessage = ({ message, onSuggestion }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-none bg-accent px-3.5 py-2.5 text-body-sm text-white'
            : 'max-w-[92%] whitespace-pre-wrap rounded-none border border-line bg-canvas px-3.5 py-2.5 text-body-sm text-ink'
        }
      >
        {message.content}
      </div>

      {/* Sources. The ref (`[T1]`) matches the bracket the model is instructed to cite, so a
          reader can trace a claim to the record it came from rather than taking it on faith. */}
      {!isUser && message.sources?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {message.sources.slice(0, 6).map((s) => (
            <span
              key={`${s.type}:${s.id}`}
              title={`${s.type}: ${s.label}`}
              className="inline-flex max-w-[13rem] items-center gap-1.5 truncate rounded-none border border-line bg-surface px-2 py-1 text-[0.6875rem] text-ink-muted"
            >
              <span className="font-medium uppercase tracking-wider text-accent">{s.ref}</span>
              <span className="truncate">{s.label}</span>
            </span>
          ))}
        </div>
      )}

      {!isUser && message.throttled && (
        <p className="text-[0.6875rem] text-ink-muted">
          Answered from this event's data — you are asking faster than the assistant can think.
        </p>
      )}

      {!isUser && message.suggestions?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {message.suggestions.slice(0, 3).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSuggestion(q)}
              className="group inline-flex items-center gap-1 rounded-none border border-line px-2.5 py-1.5 text-left text-[0.6875rem] text-ink-muted transition-colors hover:border-accent hover:text-accent"
            >
              {q}
              <ArrowUpRight className="h-3 w-3 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const AssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const { event, request, clearRequest } = useAssistantContext();

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const scrollRef = useRef(null);
  // The nonce of the last deep-linked question this widget has already handled. Compared rather
  // than a boolean because `send` is re-created whenever the conversation changes, so the effect
  // below re-runs constantly — without the guard it would re-ask the same question on every
  // render.
  const handledRequestRef = useRef(null);

  // Focus the input on open, and hand focus back to the launcher on close — otherwise closing
  // with the keyboard drops focus to `<body>` and the next Tab starts from the top of the page.
  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, pending]);

  const send = useCallback(
    async (text) => {
      const question = String(text || '').trim();
      if (!question || pending) return;

      setError(null);
      setInput('');

      // Captured before the state update so the request carries the turns that preceded it,
      // not the optimistic user message we are about to append.
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));

      setMessages((prev) => [...prev, { role: 'user', content: question }]);
      setPending(true);

      try {
        const { data } = await api.post('/ai/assistant', {
          message: question,
          history,
          eventId: event?.id || null
        });

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply || 'I could not put an answer together for that.',
            sources: data.sources || [],
            suggestions: data.suggestions || [],
            throttled: data.throttled
          }
        ]);
      } catch (err) {
        const retry = err?.response?.data?.retryAfter;
        setError(
          err?.response?.status === 429
            ? `Too many questions at once. Try again in ${retry || 60} seconds.`
            : 'The assistant is unavailable right now. You can still browse the event pages.'
        );
      } finally {
        setPending(false);
      }
    },
    [messages, pending, event]
  );

  // A question handed in from elsewhere on the site (the landing page's AI section). Opening the
  // panel and asking in one step is the whole point — dropping the visitor into an empty composer
  // would make them retype a question the page already wrote for them.
  useEffect(() => {
    if (!request || handledRequestRef.current === request.nonce) return;
    handledRequestRef.current = request.nonce;
    setIsOpen(true);
    send(request.question);
    clearRequest();
  }, [request, send, clearRequest]);

  const starters = messages.length === 0
    ? event
      ? [
          `What is on the schedule for ${event.title}?`,
          'How much are tickets?',
          'Who is speaking?',
          'Where is it being held?'
        ]
      : DEFAULT_SUGGESTIONS
    : [];

  return (
    <>
      {/* Launcher */}
      {!isOpen && (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open the event assistant"
          aria-expanded={false}
          className="group fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 rounded-none bg-night px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-menu transition-colors hover:bg-night-raised"
        >
          <Sparkles className="h-4 w-4 text-accent transition-transform duration-300 group-hover:rotate-12" />
          <span>Ask AI</span>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Event assistant"
          className="fixed bottom-6 right-6 z-40 flex h-[min(34rem,calc(100vh-3rem))] w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-none border border-line bg-surface shadow-menu motion-reduce:animate-none animate-rise-in"
        >
          {/* Header. `h-14` keeps it aligned with the launcher's own height rhythm. */}
          <div className="flex shrink-0 items-center justify-between border-b border-line bg-night px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 shrink-0 text-accent" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Forge Assistant</p>
                <p className="mt-0.5 text-[0.6875rem] text-night-muted">
                  {event ? `Reading ${event.title}` : 'Grounded in live event data'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                launcherRef.current?.focus();
              }}
              aria-label="Close the assistant"
              className="flex h-8 w-8 items-center justify-center text-night-muted transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conversation */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="border border-line bg-canvas px-3.5 py-3">
                  <p className="text-body-sm text-ink">
                    I answer from this event's live programme, pricing and venue records — and I
                    show you which record each answer came from.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="eyebrow text-ink-muted">Try asking</p>
                  {starters.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="group flex w-full items-center justify-between gap-2 rounded-none border border-line px-3 py-2.5 text-left text-body-sm text-ink transition-colors hover:border-accent hover:text-accent"
                    >
                      <span>{q}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <AssistantMessage key={i} message={m} onSuggestion={send} />
            ))}

            {pending && (
              <div className="flex items-center gap-2 text-body-sm text-ink-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                <span>Checking the event records…</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 border border-danger/30 bg-danger-soft px-3 py-2.5 text-body-sm text-danger">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="shrink-0 border-t border-line bg-canvas px-3 py-3"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="assistant-input" className="sr-only">
                Ask a question about this event
              </label>
              <input
                id="assistant-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                disabled={pending}
                placeholder={event ? 'Ask about this event…' : 'Ask about any event…'}
                className="h-10 flex-1 rounded-none border border-line bg-surface px-3 text-body-sm text-ink placeholder:text-ink-muted/60 outline-none transition-colors focus:border-accent disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                aria-label="Send question"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-accent text-white transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-40 disabled:grayscale"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[0.6875rem] leading-relaxed text-ink-muted">
              Answers are generated from this event's live data and may be incomplete. Confirm
              anything critical with the organizer.
            </p>
          </form>
        </div>
      )}
    </>
  );
};
