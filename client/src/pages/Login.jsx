import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CountUp } from '../components/motion/CountUp';
import { Layers, Shield, Lock, Mail } from 'lucide-react';
import api from '../utils/api';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // The demo roles are only worth clicking if there is something behind them. These are the same
  // public aggregates the landing page shows, and a failure here just drops the strip.
  useEffect(() => {
    let cancelled = false;
    api
      .get('/stats/public')
      .then((res) => {
        if (!cancelled) setStats(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
      navigate('/dashboard');
    } catch (err) {
      setError('Quick role login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Six pastel chips would reintroduce the rainbow the restyle removes; one neutral
  // treatment with a small status dot keeps the roles distinguishable without colour-coding.
  const roles = [
    { title: 'Platform Admin', email: 'admin@eventforge.com', dot: 'bg-warning' },
    { title: 'Event Organizer', email: 'organizer@eventforge.com', dot: 'bg-accent' },
    { title: 'Event Staff', email: 'staff@eventforge.com', dot: 'bg-info' },
    { title: 'Speaker', email: 'speaker@eventforge.com', dot: 'bg-accent' },
    { title: 'Attendee', email: 'attendee@eventforge.com', dot: 'bg-success' },
    { title: 'Sponsor', email: 'sponsor@eventforge.com', dot: 'bg-ink-muted' }
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-8 py-16 text-ink">
      <div className="grid w-full max-w-4xl grid-cols-1 items-center gap-12 md:grid-cols-12">
        {/* Form */}
        <Card hover={false} className="p-8 md:col-span-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-none bg-accent">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-display text-3xl leading-none text-ink">
              SIGN IN TO EVENT<span className="text-accent">FORGE</span>
            </h1>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-danger-soft p-3 text-xs font-medium text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="eyebrow mb-2 block text-ink-muted">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-ink-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="eyebrow mb-2 block text-ink-muted">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-ink-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="field pl-10"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} variant="primary" className="w-full">
              {loading ? 'Authenticating…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">
            Don't have an account?{' '}
            <Link to="/register" className="link-sweep font-semibold text-accent">
              Create Account
            </Link>
          </p>
        </Card>

        {/* 1-click persona demo */}
        <div className="space-y-4 md:col-span-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <h2 className="text-h3 font-semibold text-ink">Demo Role Switcher</h2>
          </div>
          <p className="text-xs text-ink-muted">
            Click any role persona to auto-login and explore its scoped dashboard.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {roles.map((r, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickRole(r.email)}
                className="rounded-md border border-line bg-surface p-3.5 text-left transition-colors hover:border-accent"
              >
                <p className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
                  {r.title}
                </p>
                <p className="mt-1 text-[10px] text-ink-muted">{r.email}</p>
              </button>
            ))}
          </div>

          {/* Real counts, so the demo roles are not opening an empty workspace. */}
          {stats && (
            <div className="grid grid-cols-3 gap-px border border-line bg-line">
              {[
                { value: stats.events, label: 'Programmes' },
                { value: stats.sessions, label: 'Sessions' },
                { value: stats.registrations, label: 'Registrations' }
              ].map((tile) => (
                <div key={tile.label} className="min-w-0 bg-surface px-2 py-5 text-center sm:px-4">
                  <p className="font-display text-3xl text-outline text-ink">
                    <CountUp value={tile.value} />
                  </p>
                  {/* `min-w-0` on the cell and `break-words` here are the difference between
                      fitting a phone and pushing the document 11px wide: a grid item's automatic
                      minimum is its min-content width, and "REGISTRATIONS" in tracked uppercase
                      is wider than a third of a 375px screen. */}
                  <p className="eyebrow mt-2 break-words text-ink-muted">{tile.label}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs leading-relaxed text-ink-muted">
            The demo accounts are public and shared — see{' '}
            <Link to="/legal#terms" className="link-sweep font-semibold text-accent">
              Terms of Use
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};
