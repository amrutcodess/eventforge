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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-8 py-16 text-ink">
      <Card hover={false} className="w-full max-w-lg p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-accent">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <h1 className="font-display text-3xl leading-none text-ink">
            CREATE AN ACCOUNT
          </h1>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-danger-soft p-3 text-xs font-medium text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="eyebrow mb-2 block text-ink-muted">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Elena Rostova"
              className="field"
            />
          </div>

          <div>
            <label className="eyebrow mb-2 block text-ink-muted">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="elena@neuraldynamics.io"
              className="field"
            />
          </div>

          <div>
            <label className="eyebrow mb-2 block text-ink-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
              className="field"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="eyebrow mb-2 block text-ink-muted">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Neural Dynamics"
                className="field"
              />
            </div>
            <div>
              <label className="eyebrow mb-2 block text-ink-muted">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VP of AI"
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="eyebrow mb-2 block text-ink-muted">
              Topic Interests (for AI recommendations)
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Comma separated topics"
              className="field"
            />
          </div>

          <Button type="submit" disabled={loading} variant="primary" className="mt-2 w-full">
            {loading ? 'Creating account…' : 'Register Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Sign In
          </Link>
        </p>
      </Card>
    </div>
  );
};
