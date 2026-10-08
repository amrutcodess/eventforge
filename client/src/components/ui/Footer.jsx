import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Shield } from 'lucide-react';

/**
 * The three links in the bottom row used to be `<span>`s with `cursor-pointer`: they looked
 * clickable, hovered like links, and did nothing. They now point at the data-and-terms page,
 * whose content is checkable against the schemas, and at the landing page's access section.
 *
 * The two static lists are kept as lists because they are a feature summary, not navigation —
 * turning six capability names into six links to the same anchor would be padding. What they do
 * have is a real destination next to them.
 */

const PLATFORM_LINKS = [
  { label: 'Discover summits', to: '/#featured-events' },
  { label: 'Capabilities', to: '/#capabilities' },
  { label: 'AI assistant', to: '/#ai' },
  { label: 'Live pricing', to: '/#pricing' },
  { label: 'FAQ', to: '/#faq' }
];

const ROLES = [
  'Platform Admin',
  'Event Organizer',
  'Event Staff & Operations',
  'Speaker Portal',
  'Attendee Management',
  'Sponsor Deliverables'
];

const ENGINE = [
  'Session Conflict Scheduler',
  'QR Code Scanner Check-in',
  'AI Copy & Summaries',
  'AI Session Matcher',
  'Recharts Analytics'
];

export const Footer = () => {
  return (
    <footer className="section-dark font-sans">
      <div className="gutter">
        <div className="grid grid-cols-1 gap-12 pb-12 md:grid-cols-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-none bg-accent">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-2xl tracking-tight text-white">EVENTFORGE</span>
            </div>
            <p className="text-body-sm text-white/70">
              Production-grade corporate event and conference platform for high-impact summits,
              workshops and exhibitions.
            </p>
          </div>

          <div>
            <h4 className="eyebrow mb-4 text-white/50">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="link-sweep text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="eyebrow mb-4 text-white/50">Platform Roles</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              {ROLES.map((role) => (
                <li key={role}>{role}</li>
              ))}
            </ul>
            <Link
              to="/login"
              className="link-sweep mt-4 inline-block text-xs font-semibold text-accent"
            >
              Sign in as any of them
            </Link>
          </div>

          <div>
            <h4 className="eyebrow mb-4 text-white/50">Core Engine</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              {ENGINE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-night-line pt-8 text-xs text-white/50 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/70">
              <Shield className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>Role-Based Event Authorization</span>
            </div>
            <p>© 2026 EVENTFORGE. Production Capstone Project. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/legal#data" className="link-sweep transition-colors hover:text-white">
              Data &amp; Privacy
            </Link>
            <Link to="/legal#terms" className="link-sweep transition-colors hover:text-white">
              Terms of Use
            </Link>
            <Link to="/#security" className="link-sweep transition-colors hover:text-white">
              Security Spec
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
