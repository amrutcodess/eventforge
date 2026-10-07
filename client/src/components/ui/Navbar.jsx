import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { Badge } from './Badge';
import { Shield, Sparkles, Layers, QrCode, ChevronDown, LogOut } from 'lucide-react';

export const Navbar = ({ onOpenQRScanner }) => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const demoAccounts = [
    { role: 'Platform Admin', email: 'admin@eventforge.com', badge: 'warning' },
    { role: 'Event Organizer', email: 'organizer@eventforge.com', badge: 'accent' },
    { role: 'Event Staff', email: 'staff@eventforge.com', badge: 'info' },
    { role: 'Speaker', email: 'speaker@eventforge.com', badge: 'gold' },
    { role: 'Attendee', email: 'attendee@eventforge.com', badge: 'success' },
    { role: 'Sponsor', email: 'sponsor@eventforge.com', badge: 'dark' }
  ];

  const handleQuickLogin = async (email) => {
    try {
      await login(email, 'password123');
      setRoleDropdownOpen(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-forge-obsidian/85 backdrop-blur-xl border-b border-white/10 text-white transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo Left */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-2xl bg-forge-accent border border-emerald-400/40 flex items-center justify-center shadow-forge-glow transition-transform group-hover:scale-105">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold tracking-tight text-white leading-none">
              EVENT<span className="text-forge-gold">FORGE</span>
            </span>
            <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-widest mt-1">
              ScrollTide Luxury Edition
            </span>
          </div>
        </Link>

        {/* Links Center */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide text-slate-300">
          <Link to="/" className="hover:text-emerald-400 transition-colors">Discover Summits</Link>
          <Link to="/events/global-ai-cloud-summit-2026" className="hover:text-emerald-400 transition-colors">Flagship Agenda</Link>
          {user && (
            <Link to="/dashboard" className="hover:text-emerald-400 transition-colors flex items-center gap-2 text-emerald-300 font-bold">
              <Sparkles className="w-4 h-4 text-forge-gold animate-pulse" />
              <span>Role Workspace</span>
            </Link>
          )}
        </div>

        {/* CTA Right & Quick Role Switcher */}
        <div className="flex items-center gap-3">
          
          {/* Staff Quick QR Scanner Trigger */}
          {user && onOpenQRScanner && (
            <button
              onClick={onOpenQRScanner}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-forge-accent/40 border border-emerald-500/50 rounded-full hover:bg-forge-accent/70 transition-colors shadow-forge-glow"
              title="Launch QR Ticket Scanner"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>QR Scanner</span>
            </button>
          )}

          {/* Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/15 rounded-full text-slate-200 transition-all backdrop-blur-md"
            >
              <Shield className="w-3.5 h-3.5 text-forge-gold" />
              <span className="hidden sm:inline">Role Switcher</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-forge-darkCard border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-2xl">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1-Click Persona Login</p>
                </div>
                <div className="py-1">
                  {demoAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickLogin(acc.email)}
                      className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-forge-accent/40 rounded-xl flex items-center justify-between transition-colors my-0.5"
                    >
                      <span className="font-semibold">{acc.role}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{acc.email.split('@')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Auth Buttons */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={user.fullName}
                  className="w-9 h-9 rounded-full border border-emerald-400/50 object-cover"
                />
                <span className="hidden md:inline">{user.fullName.split(' ')[0]}</span>
              </Link>
              <button
                onClick={logout}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-white/10 flex items-center justify-center transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

        </div>

      </div>
    </nav>
  );
};
