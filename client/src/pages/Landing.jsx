import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeroCenterpiece } from '../components/3d/HeroCenterpiece';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Calendar, MapPin, Users, Sparkles, ArrowRight, ShieldCheck, Zap, Layers, Award, CheckCircle2 } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-forge-bg text-slate-900 font-sans selection:bg-forge-accent selection:text-white">
      
      {/* HERO SECTION — Premium Dark Agency Aesthetic */}
      <section className="relative bg-forge-dark text-white overflow-hidden pt-12 pb-24 border-b border-forge-darkBorder">
        {/* Soft Ambient Radial Backgrounds */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-forge-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-forge-gold/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-8">
              
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forge-darkCard border border-forge-darkBorder text-xs font-semibold text-slate-300">
                <Badge variant="accent">PRODUCTION CAPSTONE</Badge>
                <span className="text-slate-400">Enterprise Corporate Event Infrastructure</span>
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
                Architecting <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-forge-gold italic">
                  World-Class
                </span> Summits.
              </h1>

              <p className="text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
                Elevate corporate conferences, executive masterclasses, and global partner expos with role-scoped authorization, dynamic session conflict resolution, and QR ticket check-ins.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/events/global-ai-cloud-summit-2026">
                  <Button size="lg" variant="primary">
                    Explore Flagship Summit
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="dark" className="border-slate-700 hover:border-slate-500">
                    Role Workspace Demo
                  </Button>
                </Link>
              </div>

              {/* Status Badges Row */}
              <div className="pt-6 border-t border-slate-800/80 flex items-center gap-8 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Role & Event Auth</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-forge-gold" />
                  <span>Room Scheduler Rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>OpenAI Server Drafts</span>
                </div>
              </div>

            </div>

            {/* Hero Right 3D Visual Centerpiece + Floating Secondary Cards */}
            <div className="lg:col-span-5 relative">
              
              {/* 3D WebGL Canvas */}
              <HeroCenterpiece />

              {/* Floating Secondary Card 1 (Top Left Overlap) */}
              <div className="absolute -top-4 -left-4 sm:top-4 sm:-left-6 bg-forge-darkCard/90 backdrop-blur-md border border-forge-darkBorder p-4 rounded-3xl shadow-2xl w-60 transform -rotate-3 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Live Check-in Rate</p>
                    <p className="text-lg font-serif font-bold text-emerald-400">98.4% Verified</p>
                  </div>
                </div>
              </div>

              {/* Floating Secondary Card 2 (Bottom Right Overlap) */}
              <div className="absolute -bottom-6 -right-4 sm:bottom-4 sm:-right-6 bg-forge-darkCard/90 backdrop-blur-md border border-forge-darkBorder p-4 rounded-3xl shadow-2xl w-64 transform rotate-2 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-forge-gold/20 text-forge-gold flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">AI Schedule Matcher</p>
                    <p className="text-xs text-slate-300">4 Masterclasses recommended</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>


      {/* FEATURE HIGHLIGHTS GRID */}
      <section className="py-20 bg-forge-warmGrey/50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="accent">ENGINEERED FOR SCALE</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 mt-3">
              Comprehensive Corporate Event Management
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Built on clean REST API architectures, strict MongoDB schemas, and role-based permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <Card className="hover:border-forge-accent/40">
              <div className="w-12 h-12 rounded-2xl bg-forge-accentLight text-forge-accent flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">Automated Conflict Scheduler</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Prevents double-booking across venue rooms and time slots. Room capacity constraints and speaker availability are evaluated before saving.
              </p>
            </Card>

            <Card className="hover:border-forge-accent/40">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">QR Badge Scanner & Verification</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Unique encrypted QR tokens for every attendee. On-site staff can scan codes to mark registration access and track individual session attendance.
              </p>
            </Card>

            <Card className="hover:border-forge-accent/40">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900 mb-2">AI Copywriting & Matcher</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Server-side OpenAI integration drafts high-converting event landing copy, speaker bios, and matches attendee interest profiles to sessions.
              </p>
            </Card>

          </div>

        </div>
      </section>


      {/* FEATURED EVENTS SHOWCASE */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <Badge variant="accent">UPCOMING CONFERENCES</Badge>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
                Featured Flagship Events
              </h2>
            </div>
            <Link to="/events/global-ai-cloud-summit-2026">
              <Button variant="ghost" size="sm" className="mt-4 md:mt-0 text-forge-accent">
                View All Summits
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-96 rounded-3xl bg-slate-100 animate-pulse" />
              <div className="h-96 rounded-3xl bg-slate-100 animate-pulse" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map((evt) => (
                <Card key={evt._id} className="overflow-hidden p-0 border border-slate-200 group">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={evt.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}
                      alt={evt.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge variant="accent">{evt.category.toUpperCase()}</Badge>
                      <Badge variant="dark">PUBLISHED</Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-xs text-forge-gold font-bold tracking-widest uppercase mb-1">
                        {evt.orgId?.name || 'Nexus Enterprise'}
                      </p>
                      <h3 className="font-serif text-2xl font-bold leading-snug">
                        {evt.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 bg-white space-y-4">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {evt.tagline || evt.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-forge-accent" />
                        <span>{new Date(evt.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-forge-accent" />
                        <span>{evt.venueId?.name || 'San Francisco'}, {evt.venueId?.city}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Passes from</span>
                        <span className="font-serif font-bold text-slate-900">$149</span>
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
