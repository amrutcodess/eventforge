import React from 'react';
import { Link } from 'react-router-dom';
import { Database, ShieldCheck, ScrollText, ArrowLeft } from 'lucide-react';

/**
 * A real destination for the three links in the footer, which used to be `<span>`s with
 * `cursor-pointer` — they looked clickable and were not, which is the worst of both.
 *
 * Everything on this page is checkable against the code. It describes what the schemas actually
 * store and what the request layer actually does; it makes no promise the app cannot keep, and it
 * says plainly that this is a capstone project rather than a commercial service. That is more
 * useful than a boilerplate policy copied from somewhere else, which would be both untrue and
 * unreadable.
 */

const Sections = ({ items }) => (
  <dl className="mt-8 space-y-6">
    {items.map(({ term, detail }) => (
      <div key={term} className="border-t border-line pt-6">
        <dt className="font-semibold text-ink">{term}</dt>
        <dd className="mt-2 text-body-sm text-ink-muted">{detail}</dd>
      </div>
    ))}
  </dl>
);

export const Legal = () => (
  <div className="bg-canvas text-ink">
    <section className="gutter max-w-4xl py-24">
      <p className="eyebrow text-accent">
        <span className="mr-2 opacity-60">—</span>
        Data &amp; terms
      </p>

      <h1 className="mt-6 font-display text-display uppercase tracking-tight text-ink">
        What this platform stores
      </h1>

      <p className="mt-6 max-w-prose text-body-lg text-ink-muted">
        EventForge is a production-style capstone project, not a commercial service. This page
        describes exactly what the application records and what it does with it — every line below
        maps to a schema field or a request handler rather than to a template.
      </p>

      {/* ── Data ── */}
      <div id="data" className="mt-20 scroll-mt-24">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="text-h2 font-bold tracking-tight text-ink">Data &amp; privacy</h2>
        </div>

        <Sections
          items={[
            {
              term: 'Your account',
              detail:
                'Name, email address, and a bcrypt hash of your password — never the password itself. Optionally a company, a job title, an avatar URL and a list of topic interests.'
            },
            {
              term: 'Your registrations',
              detail:
                'For each ticket you take: the event, the ticket tier, an order number, the amount recorded, the registration status, and a unique QR token that is the pass itself.'
            },
            {
              term: 'Your attendance',
              detail:
                'The time you were checked in to each session, and whether the scan was by QR or entered manually. The database holds a unique index on session and attendee, so the same person cannot be counted twice for the same session.'
            },
            {
              term: 'Your feedback',
              detail:
                'The rating and any comment you submit after an event. Ratings are only ever averaged over registrations that actually left one.'
            },
            {
              term: 'What is never collected',
              detail:
                'No card or bank details — no payment gateway is connected, and the checkout flow records a registration rather than charging one. No third-party analytics, no advertising identifiers and no tracking scripts of any kind.'
            },
            {
              term: 'What the AI sees',
              detail:
                'When you ask the assistant a question, that question and the last few turns of the conversation are sent to the server so it can compose an answer from the event records. If no AI provider key is configured, they are processed on the server and never leave it. Either way they are not stored after the answer is returned.'
            }
          ]}
        />
      </div>

      {/* ── Terms ── */}
      <div id="terms" className="mt-20 scroll-mt-24">
        <div className="flex items-center gap-3">
          <ScrollText className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="text-h2 font-bold tracking-tight text-ink">Terms of use</h2>
        </div>

        <Sections
          items={[
            {
              term: 'This is a demonstration',
              detail:
                'EventForge exists to demonstrate an event-management platform. It is not offered as a commercial service and carries no warranty. Please treat it accordingly.'
            },
            {
              term: 'The demo accounts are public',
              detail:
                'The six persona accounts offered by the Role Switcher are shared and their credentials are published on this site. Do not put real personal information into a demo account.'
            },
            {
              term: 'Data may be reset',
              detail:
                'The database behind this demonstration can be reseeded or cleared at any time, and anything you create here may be removed without notice.'
            },
            {
              term: 'AI output is not authoritative',
              detail:
                'Answers, summaries, agendas and drafted copy are generated and can be incomplete or wrong. Confirm anything that matters — a price, a time, a room — against the event page or with the organizer.'
            }
          ]}
        />
      </div>

      <div className="mt-20 border-t border-line pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-body-sm font-semibold text-accent transition-colors hover:text-accent-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to the platform
        </Link>
        <p className="mt-6 flex items-center gap-2 text-body-sm text-ink-muted">
          <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
          Access is scoped per event — see the{' '}
          <Link to="/#security" className="link-sweep font-semibold text-accent">
            access and integrity
          </Link>{' '}
          section for how permissions are enforced.
        </p>
      </div>
    </section>
  </div>
);

export default Legal;
