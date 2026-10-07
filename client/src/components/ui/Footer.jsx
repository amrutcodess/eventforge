import React from 'react';
import { Layers, Shield } from 'lucide-react';

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
              <span className="font-display text-2xl tracking-tight text-white">
                EVENTFORGE
              </span>
            </div>
            <p className="text-body-sm text-white/70">
              Production-grade corporate event and conference platform for high-impact
              summits, workshops and exhibitions.
            </p>
          </div>

          <div>
            <h4 className="eyebrow mb-4 text-white/50">Platform Roles</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>Platform Admin</li>
              <li>Event Organizer</li>
              <li>Event Staff &amp; Operations</li>
              <li>Speaker Portal</li>
              <li>Attendee Management</li>
              <li>Sponsor Deliverables</li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow mb-4 text-white/50">Core Engine</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li>Session Conflict Scheduler</li>
              <li>QR Code Scanner Check-in</li>
              <li>AI Copy &amp; Summaries</li>
              <li>AI Session Matcher</li>
              <li>Recharts Analytics</li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow mb-4 text-white/50">Compliance</h4>
            <div className="mb-3 flex items-center gap-2 text-xs text-white/70">
              <Shield className="h-4 w-4 text-accent" />
              <span>Role-Based Event Authorization</span>
            </div>
            <p className="text-xs text-white/50">
              © 2026 EVENTFORGE. Production Capstone Project. All rights reserved.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-night-line pt-8 text-xs text-white/50 sm:flex-row">
          <p>Built with the MERN stack and TailwindCSS.</p>
          <div className="flex items-center gap-4">
            <span className="cursor-pointer transition-colors hover:text-white">Privacy Policy</span>
            <span className="cursor-pointer transition-colors hover:text-white">Terms of Service</span>
            <span className="cursor-pointer transition-colors hover:text-white">Security Spec</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
