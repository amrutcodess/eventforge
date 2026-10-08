import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CountUp } from '../components/motion/CountUp';
import { Layers, CheckCircle2, Quote } from 'lucide-react';
import api from '../utils/api';

/**
 * The form used to sit alone on an empty canvas — the thinnest page in the app. It now shares the
 * page with a panel that says what an account actually gets you, and the numbers in that panel
 * come from the same public stats endpoint the landing page reads.
 *
 * The form still comes first in the DOM and is re-ordered visually on wide screens, so on a phone
 * a visitor who came here to register lands on the fields rather than on a pitch.
 */

const BENEFITS = [
  {
    title: 'Your interests become your schedule',
    body: 'The agenda builder turns the topics you pick below into a conflict-free personal timetable, and explains each choice.'
  },
  {
    title: 'One pass, every session',
    body: 'Your registration issues a QR pass. Staff scan it at the door, and each session you attend is recorded once — never twice.'
  },
  {
    title: 'Answers from the record',
    body: 'The assistant reads the event you are on — its sessions, speakers, tiers and venue — and shows which record each answer came from.'
  }
];

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [interests, setInterests] = useState('AI, Cloud Architecture, Generative UI');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Failure here is not worth telling the visitor about: the panel is supporting copy, so it
  // simply drops the numbers and keeps the three benefits.
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

  const statTiles = stats
    ? [
        { value: stats.events, label: 'Programmes' },
        { value: stats.sessions, label: 'Sessions' },
        { value: stats.speakers, label: 'Speakers' }
      ]
    : [];

  return (
    <div className="bg-canvas text-ink">
      <div className="gutter grid grid-cols-1 items-start gap-16 py-16 lg:grid-cols-12">
        {/* Value panel — second in the DOM, first on the left of a wide screen. */}
        <div className="order-2 lg:order-1 lg:col-span-6 lg:pt-4">
          <p className="eyebrow text-accent">
            <span className="mr-2 opacity-60">—</span>
            Create your workspace
          </p>
          <h1 className="mt-4 text-h2 font-bold tracking-tight text-ink md:text-h2-lg">
            An account gets you the whole platform
          </h1>
          <p className="mt-4 max-w-prose text-ink-muted">
            One registration covers every role you are granted on an event — attendee now, and
            organizer, staff, speaker or sponsor the moment an event grants it to you.
          </p>

          <ul className="mt-10 space-y-6">
            {BENEFITS.map(({ title: benefit, body }) => (
              <li key={benefit} className="flex gap-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-ink">{benefit}</p>
                  <p className="mt-1 text-body-sm text-ink-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          {statTiles.length > 0 && (
            <div className="mt-12 grid grid-cols-3 gap-px border border-line bg-line">
              {statTiles.map((tile) => (
                <div key={tile.label} className="min-w-0 bg-surface px-2 py-5 sm:px-4">
                  <p className="font-display text-3xl text-outline text-ink">
                    <CountUp value={tile.value} />
                  </p>
                  <p className="eyebrow mt-2 break-words text-ink-muted">{tile.label}</p>
                </div>
              ))}
            </div>
          )}

          <figure className="mt-12 border-l-2 border-accent pl-6">
            <Quote className="h-5 w-5 text-accent" aria-hidden="true" />
            <blockquote className="mt-4 text-body text-ink">
              &ldquo;My pass is a QR code on my phone, and the recommendations actually matched the
              interests I picked.&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-body-sm text-ink-muted">
              David K. Miller — Attendee,{' '}
              <span className="font-mono text-xs">attendee@eventforge.com</span>
            </figcaption>
          </figure>
        </div>

        {/* Form — first in the DOM. */}
        <Card hover={false} className="order-1 lg:order-2 w-full p-8 lg:col-span-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-none bg-accent">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-display text-3xl leading-none text-ink">CREATE AN ACCOUNT</h2>
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
            <Link to="/login" className="link-sweep font-semibold text-accent">
              Sign In
            </Link>
          </p>

          <p className="mt-4 text-center text-[0.6875rem] leading-relaxed text-ink-muted">
            The demo accounts are public and shared — see{' '}
            <Link to="/legal#terms" className="link-sweep font-semibold text-accent">
              Terms of Use
            </Link>
            . Please do not enter real personal data.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Register;
