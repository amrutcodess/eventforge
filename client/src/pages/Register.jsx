import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Layers } from 'lucide-react';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [interests, setInterests] = useState('AI, Cloud Architecture, Generative UI');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        fullName,
        email,
        password,
        company,
        title,
        interests: interests.split(',').map(i => i.trim()).filter(Boolean)
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forge-bg text-slate-900 font-sans flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-lg p-8 border border-slate-200 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-forge-accent flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Create EventForge Account</h1>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Elena Rostova"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-forge-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="elena@neuraldynamics.io"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-forge-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-forge-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Neural Dynamics"
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-forge-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VP of AI"
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-forge-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Topic Interests (For AI Recommendations)</label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Comma separated topics"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:border-forge-accent"
            />
          </div>

          <Button type="submit" disabled={loading} variant="primary" className="w-full mt-2">
            {loading ? 'Creating Account...' : 'Register Account'}
          </Button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Already registered? <Link to="/login" className="text-forge-accent font-bold hover:underline">Sign In</Link>
        </p>
      </Card>
    </div>
  );
};
