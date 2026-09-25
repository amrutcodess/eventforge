import React from 'react';
import { Layers, Github, Twitter, Linkedin, Shield } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-forge-dark text-white border-t border-forge-darkBorder pt-16 pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-forge-accent flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight">
                EVENT<span className="text-forge-gold">FORGE</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Production-grade corporate event & conference platform for high-impact summits, workshops, and exhibitions.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Platform Roles</h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>Platform Admin</li>
              <li>Event Organizer</li>
              <li>Event Staff & Operations</li>
              <li>Speaker Portal</li>
              <li>Attendee Management</li>
              <li>Sponsor Deliverables</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Core Engine</h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>Session Conflict Scheduler</li>
              <li>QR Code Scanner Check-in</li>
              <li>AI Copy & Summaries</li>
              <li>AI Session Matcher</li>
              <li>Recharts Analytics</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Compliance</h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Role-Based Event Authorization</span>
            </div>
            <p className="text-xs text-slate-500">
              © 2026 EVENTFORGE. Production Capstone Project. All rights reserved.
            </p>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>Built with MERN Stack + Three.js + TailwindCSS.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Security Spec</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
