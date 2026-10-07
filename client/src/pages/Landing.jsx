import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeroCenterpiece } from '../components/3d/HeroCenterpiece';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Calendar, MapPin, Users, Sparkles, ArrowRight, ShieldCheck, Zap, Layers, Award, CheckCircle2, Cpu, Globe, Activity } from 'lucide-react';
import api from '../utils/api';

export const Landing = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
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

  const tickerItems = [
    "GLOBAL AI & CLOUD SUMMIT 2026",
    "98.4% VERIFIED ON-SITE CHECK-IN",
    "AUTOMATED ROOM CONFLICT SCHEDULER",
    "ENCRYPTED DIGITAL QR BADGES",
    "SERVER-SIDE OPENAI COPY STUDIO",
    "RECHARTS REVENUE ANALYTICS",
    "SPONSOR DELIVERABLES TRACKER"
  ];

  return (
    <div className="min-h-screen bg-forge-obsidian text-slate-100 font-sans selection:bg-forge-accent selection:text-white relative overflow-hidden">
      
      {/* AMBIENT GLOW ORBS (ScrollTide Light Leaks) */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full bg-forge-accent/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-40 right-10 w-[450px] h-[450px] rounded-full bg-forge-gold/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-[1200px] left-10 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[160px] pointer-events-none" />


      {/* HERO SECTION — ScrollTide / Selene Ultra-Modern Style */}
      <section className="relative pt-12 pb-24 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Copy */}
            <div className="lg:col-span-7 space-y-8">
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/15 backdrop-blur-md text-xs font-bold text-slate-300">
                <Badge variant="gold">SCROLLTIDE LUXURY EDITION</Badge>
                <span className="text-slate-400 font-mono">MongoDB Production Capstone</span>
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
                Architecting <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-forge-gold italic">
                  Next-Gen
                </span> Summits.
              </h1>

              <p className="text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
                Elevate corporate conferences, executive masterclasses, and global expos with role-scoped authorization, dynamic session conflict resolution, and QR ticket check-ins.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/events/global-ai-cloud-summit-2026">
                  <Button size="lg" variant="primary">
                    Explore Flagship Summit
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="secondary">
                    Role Workspace Demo
                  </Button>
                </Link>
              </div>

              {/* Live Telemetry Badges */}
              <div className="pt-8 border-t border-white/10 flex flex-wrap items-center gap-8 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium">Role & Event Auth</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-forge-gold" />
                  <span className="font-medium">Conflict Scheduler</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium">OpenAI Draft Copy</span>
                </div>
              </div>

            </div>

            {/* Hero Right 3D Visual & Floating Cards */}
            <div className="lg:col-span-5 relative">
              
              {/* Three.js 3D WebGL Canvas */}
              <HeroCenterpiece />

              {/* Floating Card 1 (Top Left) */}
              <div className="absolute -top-2 -left-4 sm:top-4 sm:-left-6 bg-forge-darkCard/95 border border-white/15 p-4 rounded-3xl shadow-2xl w-60 backdrop-blur-xl animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-forge-glow">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Rate</p>
                    <p className="text-base font-serif font-bold text-emerald-400">98.4% On-Site</p>
                  </div>
                </div>
              </div>

              {/* Floating Card 2 (Bottom Right) */}
              <div className="absolute -bottom-6 -right-4 sm:bottom-4 sm:-right-6 bg-forge-darkCard/95 border border-white/15 p-4 rounded-3xl shadow-2xl w-64 backdrop-blur-xl animate-float-reverse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-forge-gold/20 border border-forge-gold/40 text-forge-gold flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Session Match</p>
                    <p className="text-xs font-bold text-white">3 Masterclasses Matched</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* INFINITE MARQUEE TICKER (ScrollTide Style) */}
      <div className="py-5 bg-white/5 border-b border-white/10 overflow-hidden backdrop-blur-md">
        <div className="flex gap-12 whitespace-nowrap animate-marquee">
          {tickerItems.concat(tickerItems).map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 text-xs font-bold font-mono tracking-widest text-slate-300">
              <Activity className="w-4 h-4 text-forge-gold" />
              <span>{item}</span>
              <span className="text-white/20">•</span>
            </div>
          ))}
        </div>
      </div>


      {/* FEATURE HIGHLIGHTS GRID */}
      <section className="py-24 border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="accent">ENGINEERED FOR ENTERPRISE</Badge>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white">
              Full-Stack Platform Architecture
            </h2>
            <p className="text-slate-400 text-sm">
              Backed by robust Express REST API routing, Mongoose schemas, and role-scoped permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <Card className="hover:border-emerald-400/50">
              <div className="w-12 h-12 rounded-2xl bg-forge-accent/40 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-6 shadow-forge-glow">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">Automated Conflict Scheduler</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Prevents double-booking across venue rooms and time slots. Room capacity constraints and speaker availability are evaluated before saving.
              </p>
            </Card>

            <Card className="hover:border-emerald-400/50">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">QR Badge Scanner & Verification</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Unique encrypted QR tokens for every attendee. On-site staff scan codes to mark registration access and track session attendance.
              </p>
            </Card>

            <Card className="hover:border-emerald-400/50">
              <div className="w-12 h-12 rounded-2xl bg-forge-gold/20 border border-forge-gold/40 text-amber-300 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-white mb-2">AI Copywriting & Matcher</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Server-side OpenAI integration drafts high-converting event copy, speaker bios, and matches attendee interest profiles to sessions.
              </p>
            </Card>

          </div>

        </div>
      </section>


      {/* FEATURED EVENTS SHOWCASE */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <Badge variant="gold">FLAGSHIP SUMMITS</Badge>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">
                Featured Global Conferences
              </h2>
            </div>
            <Link to="/events/global-ai-cloud-summit-2026">
              <Button variant="ghost" size="sm" className="mt-4 md:mt-0 text-emerald-300">
                View All Summits
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-96 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
              <div className="h-96 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map((evt) => (
                <Card key={evt._id} className="p-0 border border-white/15 overflow-hidden group hover:border-emerald-400/50 transition-all">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={evt.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}
                      alt={evt.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-forge-darkCard via-forge-darkCard/40 to-transparent" />
                    
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge variant="accent">{evt.category.toUpperCase()}</Badge>
                      <Badge variant="dark">PUBLISHED</Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-xs text-forge-gold font-mono font-bold uppercase mb-1">
                        {evt.orgId?.name || 'Nexus Enterprise'}
                      </p>
                      <h3 className="font-serif text-2xl font-bold leading-snug">
                        {evt.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 bg-forge-darkCard/90">
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {evt.tagline || evt.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <span>{new Date(evt.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-forge-gold" />
                        <span>{evt.venueId?.name || 'San Francisco'}, {evt.venueId?.city}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Passes from</span>
                        <span className="font-serif font-bold text-white text-lg">$149</span>
                      </div>
                      <Link to={`/events/${evt.slug}`}>
                        <Button variant="primary" size="sm">
                          Register & View Agenda
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      </section>

    </div>
  );
};
