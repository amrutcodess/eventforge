import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Layers, Shield, ArrowRight, Lock, Mail } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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

  const roles = [
    { title: 'Platform Admin', email: 'admin@eventforge.com', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { title: 'Event Organizer', email: 'organizer@eventforge.com', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { title: 'Event Staff', email: 'staff@eventforge.com', color: 'bg-sky-50 text-sky-700 border-sky-200' },
    { title: 'Speaker', email: 'speaker@eventforge.com', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { title: 'Attendee', email: 'attendee@eventforge.com', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { title: 'Sponsor', email: 'sponsor@eventforge.com', color: 'bg-slate-100 text-slate-700 border-slate-200' }
  ];

  return (
    <div className="min-h-screen bg-forge-bg text-slate-900 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left Form */}
        <Card className="md:col-span-6 p-8 border border-slate-200 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-forge-accent flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-slate-900">Sign In to EventForge</h1>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-forge-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-forge-accent"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} variant="primary" className="w-full">
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-6">
            Don't have an account? <Link to="/register" className="text-forge-accent font-bold hover:underline">Create Account</Link>
          </p>
        </Card>

        {/* Right 1-Click Persona Demo Panel */}
        <div className="md:col-span-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-forge-gold" />
            <h2 className="font-serif text-xl font-bold text-slate-900">Demo Role Switcher</h2>
          </div>
          <p className="text-xs text-slate-600">Click any role persona to auto-login & explore role-scoped dashboards:</p>

          <div className="grid grid-cols-2 gap-3">
            {roles.map((r, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickRole(r.email)}
                className={`p-3.5 rounded-2xl border text-left transition-all hover:scale-102 ${r.color}`}
              >
                <p className="font-serif font-bold text-xs">{r.title}</p>
                <p className="text-[10px] opacity-80 mt-0.5">{r.email}</p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
