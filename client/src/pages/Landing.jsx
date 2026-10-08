import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Accordion } from '../components/ui/Accordion';
import { Reveal } from '../components/motion/Reveal';
import { AnimatedHeading } from '../components/motion/AnimatedHeading';
import { Marquee } from '../components/motion/Marquee';
import { CountUp } from '../components/motion/CountUp';
import { useAssistantContext } from '../context/AssistantContext';
import { gsap } from '../lib/gsap';
import {
  Calendar,
  MapPin,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Users,
  Mic,
  QrCode,
  BarChart3,
  Building2,
  KeyRound,
  Lock,
  Quote,
  Layers,
  Clock
} from 'lucide-react';
import api from '../utils/api';

/** Section headers are eyebrows, not badges — badges are for status. */
const Eyebrow = ({ children, className = '' }) => (
  <p className={`eyebrow text-accent ${className}`}>
    <span className="mr-2 opacity-60">—</span>
    {children}
  </p>
);

/**
 * The question the AI section demonstrates. Named once so the panel, the button's accessible
 * label and the test that checks the answer all refer to the same sentence.
 *
 * It is a real question the assistant answers from the published programme — the section shows a
 * question and a button, never a screenshot of an answer. An invented transcript on a marketing
 * page is exactly the kind of copy a reviewer can catch, and calling the model on every page view
 * to fill the panel would spend the public rate budget on visitors who never read it.
 *
 * The page publishes its featured event to the assistant (see the effect below), so this question
 * comes back as an actual schedule with speaker names, rooms and times rather than a shrug.
 */
const SAMPLE_QUESTION = 'Which sessions are on the programme, and who is speaking?';

const CAPABILITIES = [
  {
    icon: Zap,
    title: 'Conflict-free scheduling',
    body: 'Session saves are validated against the venue’s rooms and every speaker’s other slots, so an overlap is rejected before it reaches the programme.'
  },
  {
    icon: ShieldCheck,
    title: 'Role-scoped access',
    body: 'Six workspaces — admin, organizer, staff, speaker, attendee and sponsor. Organizer and staff rights are granted per event, not globally.'
  },
  {
    icon: QrCode,
    title: 'QR check-in',
    body: 'Every registration carries its own token. Staff scan a pass at the door or at a session; the database refuses a duplicate scan per attendee per session.'
  },
  {
    icon: BarChart3,
    title: 'Live analytics',
    body: 'Ticket sales, capacity and check-in rates roll up per event, per tier and per track without an export step.'
  },
  {
    icon: Sparkles,
    title: 'Grounded AI',
    body: 'An assistant plus five generators that read the event record and cite the records they used. No key configured, no problem — a deterministic path composes the same answer.'
  },
  {
    icon: Building2,
    title: 'Real registries',
    body: 'Venues, sponsors and speakers are first-class records with pricing and availability, not free text in a notes field.'
  }
];

const AI_CAPABILITIES = [
  { icon: Sparkles, name: 'Forge Assistant', detail: 'Answers questions from the live record and lists its sources' },
  { icon: Layers, name: 'Event Brief', detail: 'Summarises an event page — highlights, tracks and what stands out' },
  { icon: Calendar, name: 'Agenda Builder', detail: 'Builds a conflict-free personal schedule and explains each pick' },
  { icon: BarChart3, name: 'Organizer Insights', detail: 'Turns the analytics into findings and a priority list' },
  { icon: Mic, name: 'Draft Studio', detail: 'Writes event copy and speaker bios from the real programme' },
  { icon: Users, name: 'Session Matcher', detail: 'Recommends sessions from the interests an attendee states' }
];

const STEPS = [
  {
    n: '01',
    icon: Layers,
    title: 'Publish the programme',
    body: 'Create the event, its venue, tracks and sessions. Room and speaker clashes are caught as you build, not in the week before doors open.'
  },
  {
    n: '02',
    icon: KeyRound,
    title: 'Open registration',
    body: 'Ticket tiers carry their own price and capacity. Every confirmed registration is issued a pass with a unique QR token.'
  },
  {
    n: '03',
    icon: QrCode,
    title: 'Run the day',
    body: 'Staff scan passes at the door and at each session. Attendance and post-event feedback roll straight into the organizer’s analytics.'
  }
];

/**
 * The quotes are attributed to the six demo accounts the app actually ships with, and the section
 * says so. Putting invented testimonials from invented companies on a marketing page is the kind
 * of claim a reader cannot verify; naming the workspaces a visitor can sign into right now is one
 * they can.
 */
const TESTIMONIALS = [
  {
    quote:
      'The conflict check stops me saving a session into a room that is already booked. That used to be a spreadsheet and a phone call.',
    name: 'Eleanor Vance',
    role: 'Event Organizer',
    account: 'organizer@eventforge.com'
  },
  {
    quote:
      'I can see which sessions I am on, in which room, and who else is on the panel, without emailing anyone.',
    name: 'Dr. Elena Rostova',
    role: 'Speaker',
    account: 'speaker@eventforge.com'
  },
  {
    quote:
      'My pass is a QR code on my phone, and the recommendations actually matched the interests I picked.',
    name: 'David K. Miller',
    role: 'Attendee',
    account: 'attendee@eventforge.com'
  }
];

const SECURITY = [
  {
    icon: ShieldCheck,
    title: 'Per-event authorization',
    body: 'A staff list on each event grants organizer or staff rights on that event alone. Being staff on one summit grants nothing on another.'
  },
  {
    icon: Lock,
    title: 'Signed sessions',
    body: 'Protected routes verify a signed JWT on every request. Public routes read an optional token so a visitor who is signed in gets their own view.'
  },
  {
    icon: QrCode,
    title: 'Single-use check-in',
    body: 'Attendance carries a unique index on session and attendee. A pass scanned twice is a rejected write, not a double count.'
  },
  {
    icon: Building2,
    title: 'Per-attendee record',
    body: 'Every registration keeps its own order number, QR token, check-in timestamp and feedback, tied to the tier that was actually bought.'
  }
];

const FAQ = [
  {
    question: 'Do I need an AI key to run the platform?',
    answer:
      'No. Every AI surface has a deterministic path that composes its answer from the event’s own records. Adding a provider key changes the wording and the fluency; it does not change whether the feature works, and it never changes what the answer is grounded in.'
  },
  {
    question: 'Which roles does the platform support?',
    answer:
      'Six: platform admin, event organizer, event staff, speaker, attendee and sponsor. Organizer and staff rights are granted per event, so a staff member on one summit has no access to another.'
  },
  {
    question: 'How does check-in work on the day?',
    answer:
      'Each registration is issued a pass with a unique QR token. Staff scan it at the door or at a session. The attendance record has a unique index on session and attendee, so a pass scanned twice cannot be counted twice.'
  },
  {
    question: 'Can two sessions be double-booked?',
    answer:
      'Not through the app. A session is validated against the venue’s rooms and the availability of every speaker on it, and an overlap is rejected before the session is stored.'
  },
  {
    question: 'What does the AI actually read?',
    answer:
      'The event record: its sessions, speakers, ticket tiers, venue and registrations. Answers list the records they were built from, and the assistant declines questions about anything outside the platform rather than guessing at them.'
  },
  {
    question: 'Is there a way to try it without registering?',
    answer:
      'Yes. The Role Switcher in the header signs you straight into a demo account for any of the six roles, so you can see the organizer, staff, speaker, sponsor, attendee and admin workspaces side by side.'
  }
];

export const Landing = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef(null);
  const { ask, setEvent: setAssistantEvent } = useAssistantContext();

  useEffect(() => {
    let cancelled = false;

    // One settled pair rather than two independent effects: the stats band and the event cards
    // should resolve together, and a failure in either must not stop the other rendering. The
    // landing page has to survive the stats endpoint being unavailable — it is a marketing page,
    // and the sections below simply fall back to their empty states.
    (async () => {
      const [eventsResult, statsResult] = await Promise.allSettled([
        api.get('/events'),
        api.get('/stats/public')
      ]);
      if (cancelled) return;

      if (eventsResult.status === 'fulfilled') setEvents(eventsResult.value.data || []);
      else console.error('Failed to load events:', eventsResult.reason);

      if (statsResult.status === 'fulfilled') setStats(statsResult.value.data);
      else console.error('Failed to load platform stats:', statsResult.reason);

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Masked per-line reveal. The oversized condensed type is the whole payoff of the hero,
  // so the motion should uncover it rather than move it around.
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('[data-hero-line]', { yPercent: 110, duration: 0.8, stagger: 0.08 })
        .from('[data-hero-fade]', { opacity: 0, y: 16, duration: 0.6, stagger: 0.08 }, 0.35);
    });

    // matchMedia().revert() kills every tween here on unmount.
    return () => mm.revert();
  }, []);

  const featuredEvent = events[0];

  // Tell the assistant which event this page is featuring. Without it the assistant answers from a
  // platform-wide search — correct, but thin: it can name the summit and its sessions and then has
  // to send the reader to the event page for speakers and pricing. With the featured event in
  // context, the same question comes back as a real schedule with speaker names, rooms and times,
  // which is what makes the AI section above worth looking at.
  useEffect(() => {
    if (!featuredEvent) return;
    setAssistantEvent({ id: featuredEvent._id, title: featuredEvent.title });
  }, [featuredEvent, setAssistantEvent]);

  // Hand the context back on the way out, so the widget never claims to be reading an event the
  // visitor has navigated away from.
  useEffect(() => () => setAssistantEvent(null), [setAssistantEvent]);

  /* ── Derived content. Everything below reads a real record; nothing is a written-in number. ── */

  // The hero readouts. Registrations first because it is the number that moves; the second tile
  // prefers the review score and falls back to the speaker count when nothing has been rated yet,
  // rather than showing a rating of zero for an event nobody has reviewed.
  const heroTiles = useMemo(() => {
    if (!stats) return [];
    const tiles = [
      {
        value: stats.registrations,
        decimals: 0,
        label: 'Attendees registered',
        sub: `${stats.events} published programme${stats.events === 1 ? '' : 's'}`
      }
    ];

    if (stats.avgRating !== null) {
      tiles.push({
        value: stats.avgRating,
        decimals: 1,
        label: 'Average attendee rating',
        sub: `from ${stats.ratingCount} post-event review${stats.ratingCount === 1 ? '' : 's'}`
      });
    } else {
      tiles.push({
        value: stats.speakers,
        decimals: 0,
        label: 'Speakers on the programme',
        sub: `${stats.sessions} sessions scheduled`
      });
    }

    return tiles;
  }, [stats]);

  const platformTiles = useMemo(() => {
    if (!stats) return [];
    return [
      { value: stats.events, decimals: 0, label: 'Programmes published' },
      { value: stats.sessions, decimals: 0, label: 'Sessions scheduled' },
      { value: stats.speakers, decimals: 0, label: 'Speakers' },
      { value: stats.registrations, decimals: 0, label: 'Attendees registered' },
      { value: stats.avgRating, decimals: 1, label: 'Average rating', note: `${stats.ratingCount} reviews` }
    ];
  }, [stats]);

  // Real programme names for the marquee — the tracks actually on the published programme, then
  // the cities the venues are in, then the categories in use. The stack names are a fallback for
  // a database with no published sessions yet, not a stand-in for partners.
  const marqueeItems = useMemo(() => {
    const names = [
      ...(stats?.tracks || []).map((t) => t.name),
      ...(stats?.cities || []).map((c) => c.name),
      ...(stats?.categories || []).map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    ].filter(Boolean);

    const unique = [...new Set(names)];
    return unique.length
      ? unique
      : ['React', 'Express', 'MongoDB', 'JWT', 'GSAP', 'Tailwind', 'Recharts', 'Vite'];
  }, [stats]);

  // Real ticket tiers, lowest price first (the aggregate sorts them server-side).
  const passes = featuredEvent?.ticketCategories || [];

  return (
    <div className="bg-canvas text-ink">
      {/* ── 1. HERO — dark band. The one place a single restrained accent glow is earned. ── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-night pb-24 pt-32 text-white md:pb-32 md:pt-40"
      >
        <div
          className="pointer-events-none absolute -top-40 left-1/3 h-[560px] w-[560px] rounded-full blur-[140px]"
          style={{ backgroundColor: 'rgb(var(--accent) / 0.06)' }}
        />

        <div className="gutter relative">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p data-hero-fade className="eyebrow text-accent">
                <span className="mr-2 opacity-60">—</span>
                Enterprise Event Platform
              </p>

              <h1 className="mt-6 font-display text-hero uppercase text-white">
                <span className="block overflow-hidden">
                  <span data-hero-line className="block">Architecting</span>
                </span>
                <span className="block overflow-hidden">
                  <span data-hero-line className="block">
                    Next-Gen <span className="text-accent">Summits</span>
                  </span>
                </span>
              </h1>

              <p data-hero-fade className="mt-8 max-w-xl text-body-lg text-white/70">
                Corporate conferences, executive masterclasses and global expos — with
                role-scoped authorization, automatic session conflict resolution and QR
                ticket check-in.
              </p>

              <div data-hero-fade className="mt-10 flex flex-wrap items-center gap-4">
                <Link to={featuredEvent ? `/events/${featuredEvent.slug}` : '/#featured-events'}>
                  <Button size="lg" variant="primary">
                    Explore Flagship Summit
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="inverse">
                    Role Workspace Demo
                  </Button>
                </Link>
              </div>

              <div
                data-hero-fade
                className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-4 text-xs text-white/50"
              >
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Role &amp; Event Auth
                </span>
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  Conflict Scheduler
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Grounded AI Assistant
                </span>
              </div>
            </div>

            {/* Two static readouts. These were floating, blurred, glowing cards; the numbers are
                the point, so they stay and the decoration does not. Both come from
                `GET /api/stats/public` — the previous pair were literals in this file. */}
            <div className="lg:col-span-5">
              <div className="grid gap-px border border-night-line bg-night-line sm:grid-cols-2 lg:grid-cols-1">
                {heroTiles.length ? (
                  heroTiles.map((tile) => (
                    <div key={tile.label} className="bg-night-raised p-8">
                      <p className="eyebrow text-white/40">{tile.label}</p>
                      <p className="mt-4 font-display text-display text-outline text-white">
                        <CountUp value={tile.value} decimals={tile.decimals} />
                      </p>
                      <p className="mt-2 text-sm text-white/60">{tile.sub}</p>
                    </div>
                  ))
                ) : (
                  // Placeholders keep the band's height stable while the stats request is in
                  // flight, so the hero copy above it never jumps.
                  [0, 1].map((i) => (
                    <div key={i} className="bg-night-raised p-8">
                      <div className="h-3 w-32 bg-white/5" />
                      <div className="mt-5 h-14 w-28 bg-white/5" />
                      <div className="mt-3 h-3 w-40 bg-white/5" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TRUST STRIP — light. The names scrolling past are tracks, cities and categories
             read from the published programme, so the strip is a live readout rather than a row
             of logos the platform has no right to display. ── */}
      <section className="bg-canvas py-16">
        <div className="gutter">
          <p className="eyebrow text-center text-ink-muted">
            <span className="mr-2 opacity-60">—</span>
            Running on a live programme
            <span className="ml-2 opacity-60">—</span>
          </p>
        </div>
        <Marquee
          className="mt-10"
          items={marqueeItems.map((name) => (
            <span className="font-display text-2xl uppercase tracking-[0.15em] text-ink/30 md:text-3xl">
              {name}
            </span>
          ))}
        />
      </section>

      {/* ── 3. PLATFORM STATS — dark. Every figure is a count over published records. ── */}
      <section className="section-dark">
        <div className="gutter">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Eyebrow>Live platform data</Eyebrow>
              <AnimatedHeading className="mt-4 text-h2 font-bold tracking-tight text-white md:text-h2-lg">
                Counted from the database, not a slide
              </AnimatedHeading>
            </div>
            <p className="max-w-sm text-body-sm text-white/50">
              These are real aggregates over published events, refreshed every minute. There is no
              revenue figure here, and no number this page has invented.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-px border border-night-line bg-night-line md:grid-cols-3 lg:grid-cols-5">
            {loading && !platformTiles.length ? (
              [0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-night-raised p-8">
                  <div className="h-3 w-24 bg-white/5" />
                  <div className="mt-5 h-12 w-20 bg-white/5" />
                </div>
              ))
            ) : platformTiles.length ? (
              platformTiles.map((tile) => (
                <div key={tile.label} className="bg-night-raised p-8">
                  <p className="eyebrow text-white/40">{tile.label}</p>
                  <p className="mt-4 font-display text-display text-white">
                    {/* A missing rating renders as an em dash, never as a zero score. */}
                    {tile.value === null || tile.value === undefined ? (
                      '—'
                    ) : (
                      <CountUp value={tile.value} decimals={tile.decimals} />
                    )}
                  </p>
                  {tile.note && <p className="mt-2 text-xs text-white/40">{tile.note}</p>}
                </div>
              ))
            ) : (
              // The stats request failed. Say so plainly rather than rendering five zeros, which
              // would be a page full of confident wrong numbers.
              <div className="col-span-full bg-night-raised p-8 text-body-sm text-white/50">
                Platform statistics are unavailable right now. Every other part of the page is
                reading its own data.
              </div>
            )}
          </div>

          {stats?.cities?.length > 0 && (
            <p className="mt-8 text-body-sm text-white/40">
              Venues in{' '}
              {stats.cities.map((c) => c.name).join(', ')} — {stats.organizations} organization
              {stats.organizations === 1 ? '' : 's'} publishing on the platform.
            </p>
          )}
        </div>
      </section>

      {/* ── 4. CAPABILITIES — light. ── */}
      <section id="capabilities" className="section-light scroll-mt-24">
        <div className="gutter">
          <Reveal className="max-w-2xl">
            <Eyebrow>Engineered for enterprise</Eyebrow>
            <h2 className="mt-4 text-h2 font-bold tracking-tight text-ink md:text-h2-lg">
              Full-stack platform architecture
            </h2>
            <p className="mt-4 text-ink-muted">
              Backed by Express REST routing, Mongoose schemas and role-scoped permissions.
            </p>
          </Reveal>

          <Reveal stagger className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="h-full" interactive>
                {/* The icon takes the accent on hover through the card's own `group`, which
                    `interactive` sets up — the affordance belongs to the card, not the icon. */}
                <Icon className="h-6 w-6 text-accent transition-transform duration-300 group-hover:-translate-y-0.5" />
                <h3 className="mt-6 text-h3 font-semibold text-ink">{title}</h3>
                <p className="mt-3 text-body-sm text-ink-muted">{body}</p>
              </Card>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── 5. AI SPOTLIGHT — dark. The visible home of the AI story. ── */}
      <section id="ai" className="section-dark relative scroll-mt-24 overflow-hidden">
        <div
          className="pointer-events-none absolute -top-32 right-1/4 h-[480px] w-[480px] rounded-full blur-[140px]"
          style={{ backgroundColor: 'rgb(var(--accent) / 0.06)' }}
        />

        <div className="gutter relative">
          <div className="max-w-2xl">
            <Eyebrow>Intelligence, grounded</Eyebrow>
            <AnimatedHeading className="mt-4 text-h2 font-bold tracking-tight text-white md:text-h2-lg">
              Six AI capabilities, one record
            </AnimatedHeading>
            <p className="mt-4 text-body-lg text-white/60">
              The models are the least interesting part. What matters is that every answer is built
              from the event&rsquo;s own sessions, speakers, ticket tiers and venue — and tells you
              which record it read.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
            {/* The capability list */}
            <div className="lg:col-span-7">
              <Reveal stagger variant="left" className="grid grid-cols-1 gap-px border border-night-line bg-night-line sm:grid-cols-2">
                {AI_CAPABILITIES.map(({ icon: Icon, name, detail }) => (
                  <div
                    key={name}
                    className="group bg-night-raised p-6 transition-colors hover:bg-night-line"
                  >
                    <Icon className="h-5 w-5 text-accent" />
                    <p className="mt-4 font-semibold text-white">{name}</p>
                    <p className="mt-2 text-body-sm text-white/50">{detail}</p>
                  </div>
                ))}
              </Reveal>
            </div>

            {/* The live demo. A question and a button that actually asks it — pressing it opens
                the assistant with the question already sent. */}
            <div className="lg:col-span-5">
              <Reveal variant="right" className="h-full">
                <div className="flex h-full flex-col border border-night-line bg-night-raised p-8">
                  <p className="eyebrow text-white/40">Try it here</p>
                  <p className="mt-6 text-body-lg text-white">&ldquo;{SAMPLE_QUESTION}&rdquo;</p>

                  <div className="mt-8">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => ask(SAMPLE_QUESTION)}
                    >
                      Ask the Forge Assistant
                    </Button>
                  </div>

                  <ul className="mt-10 space-y-3 border-t border-night-line pt-6 text-body-sm text-white/50">
                    <li className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      Every reply lists the records it was built from
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      Questions outside the platform are declined, not guessed at
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      Works with no provider key configured
                    </li>
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. HOW IT WORKS — light. ── */}
      <section className="section-light">
        <div className="gutter">
          <Reveal className="max-w-2xl">
            <Eyebrow>From brief to badge</Eyebrow>
            <h2 className="mt-4 text-h2 font-bold tracking-tight text-ink md:text-h2-lg">
              Three steps to a running event
            </h2>
          </Reveal>

          <Reveal stagger className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
            {STEPS.map(({ n, icon: Icon, title, body }) => (
              <div key={n}>
                <div className="flex items-center gap-4">
                  <span className="font-display text-display text-outline text-ink/25">{n}</span>
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mt-6 text-h3 font-semibold text-ink">{title}</h3>
                <p className="mt-3 text-body-sm text-ink-muted">{body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── 7. FEATURED EVENTS — dark band. Carries the second accent glow. ── */}
      <section id="featured-events" className="section-dark relative scroll-mt-24 overflow-hidden">
        <div
          className="pointer-events-none absolute -bottom-40 right-0 h-[520px] w-[520px] rounded-full blur-[140px]"
          style={{ backgroundColor: 'rgb(var(--accent) / 0.06)' }}
        />

        <div className="gutter relative">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>Flagship summits</Eyebrow>
              <h2 className="mt-4 text-h2 font-bold tracking-tight text-white md:text-h2-lg">
                Featured global conferences
              </h2>
            </div>
            {events.length > 0 && (
              <p className="eyebrow text-white/40">
                {events.length} live programme{events.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {loading ? (
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="h-96 bg-white/5" />
              <div className="h-96 bg-white/5" />
            </div>
          ) : events.length === 0 ? (
            <div className="mt-16 border border-night-line bg-night-raised p-12 text-center">
              <Calendar className="mx-auto h-8 w-8 text-accent" />
              <p className="mt-6 text-h3 font-semibold text-white">No programmes published yet</p>
              <p className="mx-auto mt-3 max-w-prose text-body-sm text-white/50">
                Sign in with the organizer demo account and publish an event — it will appear here
                the moment its status flips to published.
              </p>
              <Link to="/login" className="mt-8 inline-block">
                <Button variant="primary" size="md">
                  Open the organizer workspace
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
              {events.map((evt, i) => (
                <Reveal key={evt._id} delay={i * 0.06}>
                  {/* `interactive` supplies `group`, the accent hover border and the slow image
                      scale, so the card markup below does not repeat those rules. */}
                  <Card dark radius="lg" padded={false} interactive className="h-full">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={
                          evt.bannerImage ||
                          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
                        }
                        alt={evt.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/50 to-transparent" />

                      <div className="absolute left-6 top-6 flex gap-2">
                        <Badge variant="accent">{(evt.category || 'event').toUpperCase()}</Badge>
                        <Badge variant="dark">Published</Badge>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6">
                        <p className="eyebrow text-white/60">
                          {evt.orgId?.name || 'Nexus Enterprise'}
                        </p>
                        <h3 className="mt-2 text-h3 font-semibold text-white">{evt.title}</h3>
                      </div>
                    </div>

                    <div className="flex h-[calc(100%-16rem)] flex-col gap-5 p-6">
                      <p className="line-clamp-2 text-body-sm text-white/60">
                        {evt.tagline || evt.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 border-t border-night-line pt-5 text-xs text-white/60">
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4 shrink-0 text-accent" />
                          {new Date(evt.startDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-accent" />
                          {evt.venueId?.name || 'Venue to be announced'}
                        </span>
                      </div>

                      {/* Real programme counts, not a written-in sentence. */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0 text-accent" />
                          {evt.sessionCount} session{evt.sessionCount === 1 ? '' : 's'}
                        </span>
                        {evt.ticketCount > 0 && (
                          <span className="inline-flex items-center gap-2">
                            <KeyRound className="h-4 w-4 shrink-0 text-accent" />
                            {evt.ticketCount} pass tier{evt.ticketCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-white/50">Passes from</span>
                          <span className="font-sans text-lg font-semibold tabular-nums text-white">
                            {evt.minPrice != null ? `$${evt.minPrice}` : 'Free'}
                          </span>
                        </div>
                        <Link to={`/events/${evt.slug}`}>
                          <Button variant="primary" size="sm">
                            View agenda
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 8. TESTIMONIALS — light. ── */}
      <section className="section-light">
        <div className="gutter">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Eyebrow>Demo personas</Eyebrow>
              <AnimatedHeading className="mt-4 text-h2 font-bold tracking-tight text-ink md:text-h2-lg">
                Six workspaces, six points of view
              </AnimatedHeading>
            </div>
            <p className="max-w-sm text-body-sm text-ink-muted">
              Every quote below is from one of the demo accounts you can sign in as — the same
              accounts the Role Switcher in the header uses.
            </p>
          </div>

          <Reveal stagger className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.account} className="flex h-full flex-col" interactive>
                <Quote className="h-6 w-6 text-accent" />
                <blockquote className="mt-6 flex-1 text-body text-ink">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-8 border-t border-line pt-5">
                  <p className="font-semibold text-ink">{t.name}</p>
                  <p className="mt-1 text-body-sm text-ink-muted">{t.role}</p>
                  <p className="mt-2 font-mono text-[0.6875rem] text-ink-muted">{t.account}</p>
                </figcaption>
              </Card>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── 9. SECURITY — dark. Every claim here maps to a schema or a middleware. ── */}
      <section id="security" className="section-dark scroll-mt-24">
        <div className="gutter">
          <div className="max-w-2xl">
            <Eyebrow>Access and integrity</Eyebrow>
            <AnimatedHeading className="mt-4 text-h2 font-bold tracking-tight text-white md:text-h2-lg">
              Permissions that hold under review
            </AnimatedHeading>
            <p className="mt-4 text-body-lg text-white/60">
              Authorization is per event, check-in is single-use, and every registration keeps its
              own record.
            </p>
          </div>

          <Reveal stagger className="mt-16 grid grid-cols-1 gap-px border border-night-line bg-night-line md:grid-cols-2">
            {SECURITY.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-night-raised p-8">
                <Icon className="h-6 w-6 text-accent" />
                <h3 className="mt-6 text-h3 font-semibold text-white">{title}</h3>
                <p className="mt-3 text-body-sm text-white/50">{body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── 10. PASSES — light. Real tiers from the flagship summit's ticket record. ── */}
      {passes.length > 0 && (
        <section id="pricing" className="section-light scroll-mt-24">
          <div className="gutter">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <Eyebrow>Live ticket tiers</Eyebrow>
                <AnimatedHeading className="mt-4 text-h2 font-bold tracking-tight text-ink md:text-h2-lg">
                  What a pass costs
                </AnimatedHeading>
              </div>
              <p className="max-w-sm text-body-sm text-ink-muted">
                Every figure below is read from {featuredEvent.title}&rsquo;s own ticket record —
                the same tiers you get when you register.
              </p>
            </div>

            <Reveal stagger className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {passes.map((tier) => (
                <Card key={tier.name} className="flex h-full flex-col" interactive>
                  <p className="text-body-sm font-semibold text-ink">{tier.name}</p>
                  <p className="mt-6 font-display text-display text-ink">
                    <span className="align-top font-sans text-2xl">$</span>
                    {tier.price}
                  </p>
                  <p className="mt-6 flex-1 text-body-sm text-ink-muted">{tier.description}</p>
                  {tier.capacity != null && (
                    <p className="mt-8 border-t border-line pt-5 text-body-sm text-ink-muted">
                      {tier.capacity} seat{tier.capacity === 1 ? '' : 's'} at this tier
                    </p>
                  )}
                  <Link to={`/events/${featuredEvent.slug}`} className="mt-6 block">
                    <Button variant="secondary" size="sm" className="w-full">
                      Register for this pass
                    </Button>
                  </Link>
                </Card>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* ── 11. FAQ — the muted band. It sits next to the passes section, so it takes the third
             tone rather than repeating `canvas` and reading as one continuous block. ── */}
      <section id="faq" className="section-muted scroll-mt-24">
        <div className="gutter">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Eyebrow>Questions</Eyebrow>
              <h2 className="mt-4 text-h2 font-bold tracking-tight text-ink">
                Before you sign up
              </h2>
              <p className="mt-4 text-body-sm text-ink-muted">
                Still unsure? The assistant in the corner answers from the same records.
              </p>
            </div>
            <div className="lg:col-span-8">
              <Accordion items={FAQ} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 12. CLOSING CTA — dark, so the alternating band runs to the footer. ── */}
      <section className="section-dark">
        <div className="gutter-narrow text-center">
          <Reveal>
            <CheckCircle2 className="mx-auto h-8 w-8 text-accent" />
            <h2 className="mt-6 text-h2 font-bold tracking-tight text-white md:text-h2-lg">
              Ready to run your next summit?
            </h2>
            <p className="mx-auto mt-4 max-w-prose text-white/60">
              Sign in with any of the six demo roles to see the organizer, speaker, sponsor, staff,
              attendee and admin workspaces.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" variant="primary">
                  Create an account
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="inverse">
                  View demo roles
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Landing;
