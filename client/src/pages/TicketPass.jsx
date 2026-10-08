import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { QrCode, Sparkles, Star, Calendar, CheckCircle, Clock, User } from 'lucide-react';
import api from '../utils/api';

export const TicketPass = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [registration, setRegistration] = useState(null);
  const [recommendedSessions, setRecommendedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetchRegistrationAndAI();
  }, [id]);

  const fetchRegistrationAndAI = async () => {
    try {
      const res = await api.get('/registrations/my-all');
      const found = res.data.find(r => r._id === id || id === 'my') || res.data[0];
      if (found) {
        setRegistration(found);
        if (found.feedback?.rating) {
          setRating(found.feedback.rating);
          setComment(found.feedback.comment || '');
          setFeedbackSubmitted(true);
        }

        // Fetch AI Recommended Sessions based on attendee interests
        const aiRes = await api.post('/ai/recommend-sessions', {
          eventId: found.eventId?._id || found.eventId,
          userInterests: user?.interests || ['Technology']
        });
        setRecommendedSessions(aiRes.data.recommended || []);
      }
    } catch (err) {
      console.error('Failed to load pass:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!registration) return;
    try {
      await api.post(`/events/${registration.eventId?._id || registration.eventId}/feedback`, {
        rating,
        comment
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      console.error('Feedback submission failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-8">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-8">
        <QrCode className="h-8 w-8 text-ink-muted" />
        <h2 className="mt-6 text-h3 font-semibold text-ink">No active ticket pass found</h2>
        <Button className="mt-6" onClick={() => navigate('/')}>Discover Events</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas px-8 py-16 text-ink md:px-16">
      <div className="mx-auto max-w-4xl space-y-16">
        {/* DIGITAL BADGE — a dark inset on the light page, not a full-bleed band. */}
        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-night-line bg-night text-white md:grid-cols-12">
          {/* QR */}
          <div className="flex flex-col items-center justify-center gap-4 border-b border-night-line p-8 md:col-span-5 md:border-b-0 md:border-r">
            <div className="rounded-md border-2 border-accent bg-white p-4">
              <img
                src={registration.qrCodeDataUri}
                alt="Attendee QR Code Token"
                className="mx-auto h-48 w-48"
              />
            </div>
            <p className="font-mono text-xs text-white/60">{registration.qrCodeToken}</p>
            <Badge variant={registration.checkedIn ? 'success' : 'dark'}>
              {registration.checkedIn ? 'Verified on-site access' : 'Ready for check-in'}
            </Badge>
          </div>

          {/* Attendee */}
          <div className="space-y-5 p-8 md:col-span-7">
            <div className="flex items-center justify-between gap-4">
              <Badge variant="accent">{registration.ticketCategoryId?.name || 'VIP Pass'}</Badge>
              <span className="font-mono text-xs text-white/50">
                ORDER: {registration.orderNumber}
              </span>
            </div>

            <h1 className="font-display text-display uppercase leading-none text-white">
              {registration.eventId?.title || 'Global AI Summit 2026'}
            </h1>

            <div className="space-y-3 border-y border-night-line py-5 text-xs text-white/70">
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                <span className="font-semibold text-white">{user?.fullName}</span>
                <span>({user?.company || 'Delegate'})</span>
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                {new Date(registration.eventId?.startDate || Date.now()).toLocaleDateString(
                  undefined,
                  { month: 'short', day: 'numeric', year: 'numeric' }
                )}
              </p>
            </div>

            <p className="text-xs text-white/50">
              Present this encrypted QR badge token to on-site event staff at the main entrance
              scanner for immediate check-in badge printing.
            </p>
          </div>
        </div>

        {/* AI RECOMMENDED SESSIONS */}
        <section>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-h3 font-semibold text-ink">AI recommended sessions</h2>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Matched to your profile interests: {user?.interests?.join(', ')}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {recommendedSessions.length > 0 ? (
              recommendedSessions.map((sess) => (
                <Card key={sess._id}>
                  <Badge variant="neutral">{sess.track}</Badge>
                  <h3 className="mt-4 text-h3 font-semibold text-ink">{sess.title}</h3>
                  <p className="my-3 line-clamp-2 text-body-sm text-ink-muted">{sess.summary}</p>
                  <div className="flex items-center gap-2 border-t border-line pt-4 text-xs text-ink-muted">
                    <Clock className="h-4 w-4 text-accent" />
                    <span>
                      {new Date(sess.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span>· Room: {sess.roomName}</span>
                  </div>
                </Card>
              ))
            ) : (
              // The grid previously had no empty branch at all, so a matcher that returned
              // nothing rendered a heading, a subtitle and then blank space.
              <EmptyState
                icon={Sparkles}
                title="No matches yet"
                body={
                  user?.interests?.length
                    ? `Nothing on this event's programme lines up with ${user.interests.join(', ')} yet. The programme is still being built — check back, or ask the assistant what is on.`
                    : 'Add a few topic interests to your profile and the matcher will line sessions up against them.'
                }
                action={
                  <Link to="/dashboard">
                    <Button variant="secondary" size="sm">
                      Update your interests
                    </Button>
                  </Link>
                }
              />
            )}
          </div>
        </section>

        {/* FEEDBACK */}
        <Card>
          <h2 className="text-h3 font-semibold text-ink">Event feedback &amp; rating</h2>

          {feedbackSubmitted ? (
            <div className="mt-5 flex items-center gap-2 rounded-md bg-success-soft p-4 text-xs font-semibold text-success">
              <CheckCircle className="h-5 w-5" />
              <span>Thank you — your score ({rating}/5 stars) has been recorded.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="mt-5 space-y-5">
              <div>
                <label className="eyebrow mb-3 block text-ink-muted">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`rounded-sm p-2 transition-colors ${
                        rating >= star ? 'text-accent' : 'text-line-strong'
                      }`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="eyebrow mb-2 block text-ink-muted">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts on speakers, venue, or sessions…"
                  className="field h-24"
                />
              </div>

              <Button type="submit" variant="primary">Submit Feedback</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
