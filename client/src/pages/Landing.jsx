import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Reveal } from '../components/motion/Reveal';
import { gsap } from '../lib/gsap';
import { Calendar, MapPin, Sparkles, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

/** Section headers are eyebrows, not badges — badges are for status. */
const Eyebrow = ({ children, className = '' }) => (
  <p className={`eyebrow text-accent ${className}`}>
    <span className="mr-2 opacity-60">—</span>
    {children}
  </p>
);

export const Landing = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef(null);

  useEffect(() => {
    fetchEvents();
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

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const featuredEvent = events[0];

  return (
    <div className="bg-canvas text-ink">
      {/* ── HERO — dark band. The one place a single restrained accent glow is earned. ── */}
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

              <p
                data-hero-fade
                className="mt-8 max-w-xl text-body-lg text-white/70"
              >
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
                  OpenAI Draft Copy
                </span>
              </div>
            </div>

            {/* Two static readouts. These were floating, blurred, glowing cards; the
                numbers are the point, so they stay and the decoration does not. */}
            <div className="lg:col-span-5">
              <div className="grid gap-px border border-night-line bg-night-line sm:grid-cols-2 lg:grid-cols-1">
                <div className="bg-night-raised p-8">
                  <p className="eyebrow text-white/40">Verification Rate</p>
                  <p className="mt-4 font-display text-display text-outline text-white">98.4%</p>
                  <p className="mt-2 text-sm text-white/60">Checked in on-site</p>
                </div>
                <div className="bg-night-raised p-8">
                  <p className="eyebrow text-white/40">AI Session Match</p>
                  <p className="mt-4 font-display text-display text-outline text-white">03</p>
                  <p className="mt-2 text-sm text-white/60">Masterclasses matched</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES — light band ── */}
      <section className="section-light">
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

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Automated conflict scheduler',
                body: 'Prevents double-booking across venue rooms and time slots. Capacity and speaker availability are evaluated before saving.'
              },
              {
                icon: ShieldCheck,
                title: 'QR badge scanner',
                body: 'Unique encrypted tokens for every attendee. Staff scan codes to verify access and track session attendance.'
              },
              {
                icon: Sparkles,
                title: 'AI copywriting & matcher',
                body: 'Server-side OpenAI drafts event copy and speaker bios, and matches attendee interests to sessions.'
              }
            ].map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.06}>
                <Card className="h-full">
                  <Icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-6 text-h3 font-semibold text-ink">{title}</h3>
                  <p className="mt-3 text-body-sm text-ink-muted">{body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED EVENTS — dark band. Carries the second accent glow. ── */}
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
            <a
              href="#featured-events"
              className="eyebrow text-white/50 transition-colors hover:text-white"
            >
              View all summits
            </a>
          </div>

          {loading ? (
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="h-96 rounded-lg bg-white/5" />
              <div className="h-96 rounded-lg bg-white/5" />
            </div>
          ) : (
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
              {events.map((evt, i) => (
                <Reveal key={evt._id} delay={i * 0.06}>
                  <Card dark radius="lg" padded={false} className="group overflow-hidden">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={evt.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}
                        alt={evt.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/50 to-transparent" />

                      <div className="absolute left-6 top-6 flex gap-2">
                        <Badge variant="accent">{evt.category.toUpperCase()}</Badge>
                        <Badge variant="dark">Published</Badge>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6">
                        <p className="eyebrow text-white/60">
                          {evt.orgId?.name || 'Nexus Enterprise'}
                        </p>
                        <h3 className="mt-2 text-h3 font-semibold text-white">{evt.title}</h3>
                      </div>
                    </div>

                    <div className="space-y-5 p-6">
                      <p className="line-clamp-2 text-body-sm text-white/60">
                        {evt.tagline || evt.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 border-t border-night-line pt-5 text-xs text-white/60">
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-accent" />
                          {new Date(evt.startDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-accent" />
                          {evt.venueId?.name || 'San Francisco'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-white/50">Passes from</span>
                          <span className="font-sans text-lg font-semibold tabular-nums text-white">
                            $149
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

      {/* ── CLOSING CTA — light band, so the dark footer that follows still alternates ── */}
      <section className="section-light">
        <div className="gutter-narrow text-center">
          <Reveal>
            <CheckCircle2 className="mx-auto h-8 w-8 text-accent" />
            <h2 className="mt-6 text-h2 font-bold tracking-tight text-ink md:text-h2-lg">
              Ready to run your next summit?
            </h2>
            <p className="mx-auto mt-4 max-w-prose text-ink-muted">
              Sign in with any of the six demo roles to see the organizer, speaker,
              sponsor, staff, attendee and admin workspaces.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" variant="primary">
                  Create an account
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary">
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
