import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, Users, Layers } from 'lucide-react';
import api from '../../utils/api';
import { Reveal } from '../motion/Reveal';
import { Badge } from '../ui/Badge';

/**
 * The AI Event Brief — a generated read of the event, rendered as the first band under the hero.
 *
 * Two rules govern this component, and they are the reason it is written defensively:
 *
 *   1. **It must never be the reason the page fails.** Every branch — loading, error, empty —
 *      renders a complete band. A failed brief looks like a thinner section, not a broken page,
 *      and the rest of `EventDetail` is untouched by it.
 *   2. **It must never present generated text as authoritative.** The `source` the server
 *      returns distinguishes a model-written brief from one composed from the records, and the
 *      footer says which one you are reading. That distinction is the whole point of the
 *      fallback layer, so hiding it here would waste it.
 *
 * The server also drops any highlight whose title is not a real session in this event, so what
 * arrives here is grounded whether or not a model was involved.
 */
export const EventBrief = ({ eventId }) => {
  const [brief, setBrief] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    if (!eventId) return undefined;

    let cancelled = false;
    setState('loading');

    api
      .get(`/ai/event-brief/${eventId}`)
      .then((res) => {
        if (cancelled) return;
        setBrief(res.data);
        setState('ready');
      })
      .catch(() => {
        // A 404 here means the event is not visible to this caller, and anything else is a
        // transient failure. Both are handled the same way on purpose: render nothing rather
        // than an error, because the brief is an enhancement, not the page.
        if (!cancelled) setState('unavailable');
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (state === 'unavailable') return null;

  if (state === 'loading') {
    return (
      <section className="bg-canvas">
        <div className="gutter py-12">
          <div className="animate-pulse space-y-3 border border-line bg-surface p-6">
            <div className="h-3 w-28 bg-surface-muted" />
            <div className="h-4 w-3/4 bg-surface-muted" />
            <div className="h-4 w-2/3 bg-surface-muted" />
          </div>
        </div>
      </section>
    );
  }

  const { summary, highlights = [], tracks = [], stats = {} } = brief;

  return (
    <section className="bg-canvas">
      <div className="gutter py-12">
        <div className="border border-line bg-surface">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink">
                AI Event Brief
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {stats.sessions > 0 && (
                <Badge variant="neutral">
                  <Clock className="mr-1 h-3 w-3" />
                  {stats.days} day{stats.days !== 1 ? 's' : ''}
                </Badge>
              )}
              {stats.sessions > 0 && (
                <Badge variant="neutral">
                  <Layers className="mr-1 h-3 w-3" />
                  {stats.sessions} session{stats.sessions !== 1 ? 's' : ''}
                </Badge>
              )}
              {stats.speakers > 0 && (
                <Badge variant="neutral">
                  <Users className="mr-1 h-3 w-3" />
                  {stats.speakers} speaker{stats.speakers !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-6 p-6">
            {summary && (
              <Reveal>
                <p className="max-w-4xl text-body-lg leading-relaxed text-ink">{summary}</p>
              </Reveal>
            )}

            {highlights.length > 0 && (
              <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((h, i) => (
                  <Reveal key={h.sessionId || i} delay={i * 0.07} className="bg-surface p-5">
                    <p className="text-body-sm font-semibold text-ink">{h.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">{h.reason}</p>
                  </Reveal>
                ))}
              </div>
            )}

            {tracks.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4">
                <span className="eyebrow text-ink-muted">Tracks</span>
                {tracks.map((t) => (
                  <span key={t.name} className="text-xs text-ink-muted">
                    <span className="font-medium text-ink">{t.name}</span>
                    {t.sessionCount ? ` · ${t.sessionCount}` : ''}
                  </span>
                ))}
              </div>
            )}

            <p className="text-[0.6875rem] leading-relaxed text-ink-muted">
              {brief.source === 'llm'
                ? 'Written by AI from this event’s live programme, pricing and venue records.'
                : 'Composed from this event’s live programme, pricing and venue records.'}{' '}
              Check anything critical with the organizer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
