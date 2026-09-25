import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { QrCode, Sparkles, Star, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
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
      <div className="min-h-screen bg-forge-bg flex items-center justify-center p-8">
        <div className="w-12 h-12 rounded-full border-4 border-forge-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen bg-forge-bg flex flex-col items-center justify-center p-8">
        <h2 className="font-serif text-2xl font-bold">No Active Ticket Pass Found</h2>
        <Button className="mt-4" onClick={() => navigate('/')}>Discover Events</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forge-bg text-slate-900 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* DIGITAL BADGE CARD */}
        <div className="bg-forge-dark text-white rounded-3xl p-8 shadow-2xl border border-forge-darkBorder relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-forge-accent/20 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left QR Code Badge */}
            <div className="md:col-span-5 text-center flex flex-col items-center">
              <div className="bg-white p-4 rounded-3xl shadow-xl border-4 border-forge-accent">
                <img
                  src={registration.qrCodeDataUri}
                  alt="Attendee QR Code Token"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="font-mono text-xs text-forge-gold mt-3 font-semibold">
                {registration.qrCodeToken}
              </p>
              <Badge variant={registration.checkedIn ? 'success' : 'dark'} className="mt-2">
                {registration.checkedIn ? 'VERIFIED ON-SITE ACCESS' : 'READY FOR CHECK-IN'}
              </Badge>
            </div>

            {/* Right Attendee Info */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="accent">{registration.ticketCategoryId?.name || 'VIP Pass'}</Badge>
                <span className="text-xs font-mono text-slate-400">ORDER: {registration.orderNumber}</span>
              </div>

              <h1 className="font-serif text-3xl font-bold text-white leading-tight">
                {registration.eventId?.title || 'Global AI Summit 2026'}
              </h1>

              <div className="pt-2 pb-4 border-y border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-forge-gold" />
                  <span className="font-bold text-white">{user?.fullName}</span> ({user?.company || 'Delegate'})
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>
                    {new Date(registration.eventId?.startDate || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Present this encrypted QR badge token to on-site event staff at the main entrance scanner for immediate check-in badge printing.
              </p>
            </div>

          </div>
        </div>


        {/* AI RECOMMENDED SESSIONS FOR ATTENDEE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-forge-gold" />
            <h2 className="font-serif text-2xl font-bold text-slate-900">AI Recommended Sessions</h2>
          </div>
          <p className="text-xs text-slate-600">Matched to your profile interests: {user?.interests?.join(', ')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedSessions.map((sess) => (
              <Card key={sess._id} className="p-5 border border-slate-200">
                <Badge variant="accent">{sess.track}</Badge>
                <h3 className="font-serif text-lg font-bold text-slate-900 mt-2">{sess.title}</h3>
                <p className="text-xs text-slate-600 my-2 line-clamp-2">{sess.summary}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <Clock className="w-4 h-4 text-forge-accent" />
                  <span>{new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>• Room: {sess.roomName}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>


        {/* EVENT FEEDBACK RATING FORM */}
        <Card className="p-8 border border-slate-200 space-y-4">
          <h2 className="font-serif text-2xl font-bold text-slate-900">Event Feedback & Rating</h2>
          
          {feedbackSubmitted ? (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Thank you! Your feedback score ({rating}/5 stars) has been recorded.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-xl transition-colors ${rating >= star ? 'text-forge-gold bg-amber-50' : 'text-slate-300'}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts on speakers, venue, or sessions..."
                  className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs focus:outline-none focus:border-forge-accent h-24"
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
