import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';
import { Shield, Sparkles, Layers, ChevronDown, LogOut, Menu, X } from 'lucide-react';

const DOT = {
  warning: 'bg-warning',
  accent: 'bg-accent',
  info: 'bg-info',
  success: 'bg-success',
  dark: 'bg-ink-muted'
};

/** Section anchors on the landing page. Kept in one place so the desktop row and the mobile
    panel cannot drift apart. */
const NAV_LINKS = [
  { label: 'Platform', to: '/#capabilities' },
  { label: 'AI', to: '/#ai' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'FAQ', to: '/#faq' }
];

export const Navbar = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Kept exactly as it was — the one-click persona login is a deliberate demo affordance.
  const demoAccounts = [
    { role: 'Platform Admin', email: 'admin@eventforge.com', badge: 'warning' },
    { role: 'Event Organizer', email: 'organizer@eventforge.com', badge: 'accent' },
    { role: 'Event Staff', email: 'staff@eventforge.com', badge: 'info' },
    { role: 'Speaker', email: 'speaker@eventforge.com', badge: 'accent' },
    { role: 'Attendee', email: 'attendee@eventforge.com', badge: 'success' },
    { role: 'Sponsor', email: 'sponsor@eventforge.com', badge: 'dark' }
  ];

  // A disclosure panel that survives navigation is a trap: you tap a link and the menu is still
  // covering the page you just opened.
  //
  // `hash` is in the deps as well as `pathname` because the nav's own anchors (`/#pricing`) are
  // all on the landing page — following one changes the hash and leaves the pathname alone, so a
  // pathname-only effect never fired and the panel stayed open over the section it had just
  // scrolled to.
  useEffect(() => {
    setMobileOpen(false);
    setRoleDropdownOpen(false);
  }, [pathname, hash]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const handleQuickLogin = async (email) => {
    try {
      await login(email, 'password123');
      setRoleDropdownOpen(false);
      setMobileOpen(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  // h-20 is load-bearing: EventDetail's sticky tab bar offsets by `top-20`, and the mobile
  // panel below positions itself at `top-20` too. Do not change it. It belongs on the <nav>,
  // not the inner row: `top-20` is 80px and Tailwind's preflight is border-box, so only a 80px
  // <nav> — border included — lands the sticky bar flush. On the inner row it came to 81px and
  // overlapped the tab bar by the 1px bottom border.
  return (
    <nav className="sticky top-0 z-50 h-20 border-b border-line bg-canvas text-ink">
      <div className="gutter flex h-full items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="group flex shrink-0 items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-accent">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-xl font-bold leading-none tracking-tight text-ink">
              EVENT<span className="text-accent">FORGE</span>
            </span>
            {/* The tagline is the first thing to go on a narrow screen — it is the widest
                element in the bar and the least load-bearing. */}
            <span className="eyebrow mt-1.5 hidden text-ink-muted sm:block">
              Enterprise Event Platform
            </span>
          </div>
        </Link>

        {/* Desktop links. There was no fallback for this row at all, which left a phone with no
            navigation whatsoever — the disclosure panel at the bottom of this file is it. */}
        <div className="hidden items-center gap-8 text-sm font-medium text-ink-muted md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="link-sweep transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-accent">
              <Sparkles className="h-4 w-4" />
              Role Workspace
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Everything from here to the menu button is desktop-only. It used to render at every
              width, which is what pushed the document 140px wider than a 375px phone. */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                aria-expanded={roleDropdownOpen}
                className="flex items-center gap-2 border border-line px-3.5 py-2 text-xs font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
              >
                <Shield className="h-3.5 w-3.5 text-accent" />
                <span>Role Switcher</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    roleDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
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
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${DOT[acc.badge] || 'bg-accent'}`}
                          />
                          {acc.role}
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          {acc.email.split('@')[0]}
                        </span>
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
                    src={
                      user.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                    }
                    alt={user.fullName}
                    className="h-9 w-9 rounded-full border border-line object-cover"
                  />
                  <span>{user.fullName.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-muted transition-colors hover:border-danger/40 hover:text-danger"
                  title="Sign Out"
                  aria-label="Sign out"
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

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="flex h-10 w-10 items-center justify-center border border-line text-ink transition-colors hover:border-line-strong md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Disclosure panel. `top-20` tracks the navbar's own height, and the max-height keeps the
          persona list scrollable rather than taller than the screen. */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-20 max-h-[calc(100vh-5rem)] overflow-y-auto border-b border-line bg-canvas shadow-menu animate-fade-in md:hidden"
        >
          <div className="gutter space-y-8 py-8">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="border-b border-line py-3 text-body font-medium text-ink transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 border-b border-line py-3 text-body font-semibold text-accent"
                >
                  <Sparkles className="h-4 w-4" />
                  Role Workspace
                </Link>
              )}
            </div>

            <div>
              <p className="eyebrow text-ink-muted">1-Click Persona Login</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {demoAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickLogin(acc.email)}
                    className="flex items-center gap-2 border border-line px-3 py-2.5 text-left text-xs font-semibold text-ink transition-colors hover:border-accent"
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[acc.badge] || 'bg-accent'}`}
                    />
                    {acc.role}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {user ? (
                <Button variant="secondary" onClick={handleLogout} className="w-full">
                  Sign out
                </Button>
              ) : (
                <>
                  <Link to="/register">
                    <Button variant="primary" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
