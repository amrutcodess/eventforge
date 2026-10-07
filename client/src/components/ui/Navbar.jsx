import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { Shield, Sparkles, Layers, ChevronDown, LogOut } from 'lucide-react';

const DOT = {
  warning: 'bg-warning',
  accent: 'bg-accent',
  info: 'bg-info',
  success: 'bg-success',
  dark: 'bg-ink-muted'
};

export const Navbar = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Kept exactly as it was — the one-click persona login is a deliberate demo affordance.
  const demoAccounts = [
    { role: 'Platform Admin', email: 'admin@eventforge.com', badge: 'warning' },
    { role: 'Event Organizer', email: 'organizer@eventforge.com', badge: 'accent' },
    { role: 'Event Staff', email: 'staff@eventforge.com', badge: 'info' },
    { role: 'Speaker', email: 'speaker@eventforge.com', badge: 'accent' },
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

  // h-20 is load-bearing: EventDetail's sticky tab bar offsets by `top-20`. Do not change it.
  return (
    <nav className="sticky top-0 z-50 h-20 border-b border-line bg-canvas text-ink">
      <div className="gutter flex h-20 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-accent">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-xl font-bold leading-none tracking-tight text-ink">
              EVENT<span className="text-accent">FORGE</span>
            </span>
            <span className="eyebrow mt-1.5 text-ink-muted">Enterprise Event Platform</span>
          </div>
        </Link>

        {/* Links */}
        <div className="hidden items-center gap-8 text-sm font-medium text-ink-muted md:flex">
          <Link to="/" className="transition-colors hover:text-accent">
            Discover Summits
          </Link>
          {user && (
            <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-accent">
              <Sparkles className="h-4 w-4" />
              Role Workspace
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 border border-line px-3.5 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span className="hidden sm:inline">Role Switcher</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-line bg-surface p-2 shadow-menu animate-fade-in">
                <div className="border-b border-line px-3 py-2">
                  <p className="eyebrow text-ink-muted">1-Click Persona Login</p>
                </div>
                <div className="py-1">
                  {demoAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickLogin(acc.email)}
                      className="my-0.5 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs text-ink transition-colors hover:bg-canvas"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <span className={`h-1.5 w-1.5 rounded-full ${DOT[acc.badge] || 'bg-accent'}`} />
                        {acc.role}
                      </span>
                      <span className="text-[10px] text-ink-muted">{acc.email.split('@')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={user.fullName}
                  className="h-9 w-9 rounded-full border border-line object-cover"
                />
                <span className="hidden md:inline">{user.fullName.split(' ')[0]}</span>
              </Link>
              <button
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-muted transition-colors hover:border-danger/40 hover:text-danger"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
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
