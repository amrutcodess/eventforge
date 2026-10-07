import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Calendar, MapPin, Clock, Ticket, User, Check, Sparkles, Tag, ShieldCheck, FileText, Megaphone } from 'lucide-react';
import api from '../utils/api';

export const EventDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agenda');
  const [announcements, setAnnouncements] = useState([]);

  // Attendee session selection
  const [selectedSessionIds, setSelectedSessionIds] = useState([]);
  const [selectionsLoaded, setSelectionsLoaded] = useState(false);
  const [selectionError, setSelectionError] = useState('');

  // Checkout Modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    fetchEventDetails();
  }, [slug]);

  const fetchEventDetails = async () => {
    try {
      const res = await api.get(`/events/${slug}`);
      setEventData(res.data);
      fetchAnnouncements(res.data.event._id);

      if (res.data.userPermissions?.isAttendee) {
        fetchMySessions(res.data.event._id);
      }
    } catch (err) {
      console.error('Failed to load event:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/announcements`);
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  const fetchMySessions = async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/my-sessions`);
      setSelectedSessionIds((res.data || []).map((s) => s._id || s));
    } catch (err) {
      // A 404 here just means the attendee has not selected any sessions yet.
      console.debug('No session selection yet:', err?.response?.status);
    } finally {
      setSelectionsLoaded(true);
    }
  };

  const toggleSessionSelection = async (sessionId) => {
    if (!eventData?.event?._id) return;

    const next = selectedSessionIds.includes(sessionId)
      ? selectedSessionIds.filter((id) => id !== sessionId)
      : [...selectedSessionIds, sessionId];

    const previous = selectedSessionIds;
    setSelectedSessionIds(next);
    setSelectionError('');

    try {
      await api.put(`/events/${eventData.event._id}/my-sessions`, { sessionIds: next });
    } catch (err) {
      setSelectedSessionIds(previous);
      setSelectionError(err.response?.data?.error || 'Could not save your session selection.');
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !eventData?.event?._id) return;
    setCouponError('');
    try {
      const res = await api.post(`/events/${eventData.event._id}/coupons/validate`, {
        code: couponCode.trim()
      });
      setCouponApplied(res.data);
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon code');
      setCouponApplied(null);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedTicket || !eventData?.event?._id) return;

    setPurchasing(true);
    setCheckoutError('');

    try {
      const res = await api.post(`/events/${eventData.event._id}/register`, {
        ticketCategoryId: selectedTicket._id,
        couponCode: couponApplied ? couponApplied.code : ''
      });

      setCheckoutModalOpen(false);
      navigate(`/ticket-pass/${res.data.registration._id || 'my'}`);
    } catch (err) {
      setCheckoutError(err.response?.data?.error || 'Registration failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forge-bg flex items-center justify-center p-8">
        <div className="w-12 h-12 rounded-full border-4 border-forge-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!eventData?.event) {
    return (
      <div className="min-h-screen bg-forge-bg flex flex-col items-center justify-center p-8">
        <h2 className="font-serif text-3xl font-bold">Event Not Found</h2>
        <Button className="mt-4" onClick={() => navigate('/')}>Return to Events</Button>
      </div>
    );
  }

  const { event, tickets, speakers, sessions, sponsors, packages, userPermissions } = eventData;

  const calculateFinalPrice = () => {
    if (!selectedTicket) return 0;
    let price = selectedTicket.price;
    if (couponApplied) {
      if (couponApplied.discountType === 'percentage') {
        price = Math.max(0, price * (1 - couponApplied.discountValue / 100));
      } else {
        price = Math.max(0, price - couponApplied.discountValue);
      }
    }
    return Math.round(price * 100) / 100;
  };

  return (
    <div className="min-h-screen bg-forge-bg text-slate-900 font-sans pb-24">
      
      {/* EVENT HERO SECTION */}
      <section className="relative bg-forge-dark text-white overflow-hidden py-16 border-b border-forge-darkBorder">
        <div className="absolute inset-0 opacity-25">
          <img
            src={event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80'}
            alt={event.title}
            className="w-full h-full object-cover filter blur-sm scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-forge-dark via-forge-dark/80 to-forge-dark/50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="accent">{event.category.toUpperCase()}</Badge>
              <span className="text-xs text-forge-gold font-bold tracking-widest uppercase">
                {event.orgId?.name || 'Nexus Enterprise'}
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              {event.title}
            </h1>

            <p className="text-lg text-slate-300 font-normal leading-relaxed">
              {event.tagline || event.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-forge-gold" />
                <span>
                  {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(event.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{event.venueId?.name}, {event.venueId?.city}</span>
              </div>
            </div>

            {userPermissions?.isAttendee && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>You have a confirmed registration pass for this summit!</span>
                </div>
                <Button size="sm" variant="primary" onClick={() => navigate('/ticket-pass/my')}>
                  View Badge & QR Pass
                </Button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ORGANIZER ANNOUNCEMENTS */}
      {announcements.length > 0 && (
        <section className="bg-forge-warmGrey/60 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-3">
            {announcements.slice(0, 3).map((ann) => (
              <div
                key={ann._id}
                className="flex items-start gap-3 bg-white rounded-2xl border border-slate-200 p-4"
              >
                <Megaphone
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    ann.priority === 'urgent' ? 'text-rose-500' : 'text-forge-accent'
                  }`}
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif font-bold text-sm text-slate-900">{ann.title}</h3>
                    {ann.priority === 'urgent' && <Badge variant="danger">URGENT</Badge>}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ann.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* NAVIGATION TABS */}
      <section className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            <div className="flex gap-8 text-sm font-semibold">
              {[
                { id: 'agenda', label: `Session Schedule (${sessions?.length || 0})` },
                { id: 'speakers', label: `Keynote Speakers (${speakers?.length || 0})` },
                { id: 'tickets', label: `Ticket Passes (${tickets?.length || 0})` },
                { id: 'sponsors', label: `Partners & Sponsors (${sponsors?.length || 0})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-forge-accent text-forge-accent'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (tickets?.length > 0) setSelectedTicket(tickets[0]);
                setCheckoutModalOpen(true);
              }}
            >
              Get Tickets Now
            </Button>

          </div>
        </div>
      </section>


      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* AGENDA / SESSIONS TAB */}
        {activeTab === 'agenda' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">Summit Program & Masterclasses</h2>
              {userPermissions?.isAttendee && (
                <p className="text-xs text-slate-500 mt-1">
                  {selectedSessionIds.length > 0
                    ? `You have ${selectedSessionIds.length} session${selectedSessionIds.length === 1 ? '' : 's'} in your personal schedule.`
                    : 'Add sessions to your personal schedule to build your agenda.'}
                </p>
              )}
              {selectionError && (
                <p className="text-xs text-rose-600 font-medium mt-1">{selectionError}</p>
              )}
            </div>
            
            {sessions && sessions.length > 0 ? (
              sessions.map((sess) => (
                <Card key={sess._id} className="p-6 border border-slate-200 hover:border-forge-accent/40">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="accent">{sess.track.toUpperCase()}</Badge>
                        <span className="text-xs text-slate-500 font-medium">Room: {sess.roomName}</span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-slate-900">{sess.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-forge-warmGrey px-4 py-2 rounded-full">
                        <Clock className="w-4 h-4 text-forge-accent" />
                        <span>
                          {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(sess.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {userPermissions?.isAttendee && (
                        <button
                          onClick={() => toggleSessionSelection(sess._id)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                            selectedSessionIds.includes(sess._id)
                              ? 'bg-forge-accent text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:border-forge-accent'
                          }`}
                        >
                          {selectedSessionIds.includes(sess._id) && <Check className="w-3.5 h-3.5" />}
                          {selectedSessionIds.includes(sess._id) ? 'In My Schedule' : 'Add to Schedule'}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 my-4 leading-relaxed">{sess.summary || sess.description}</p>

                  {/* Speakers Row */}
                  {sess.speakerIds && sess.speakerIds.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center gap-4">
                      {sess.speakerIds.map((spk) => (
                        <div key={spk._id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                          <img
                            src={spk.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={spk.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-slate-800">{spk.name}</span>
                          <span className="text-[10px] text-slate-400">({spk.company})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Resource Files */}
                  {sess.resources && sess.resources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
                      <FileText className="w-4 h-4 text-forge-accent" />
                      <span className="text-xs text-slate-500 font-medium">Session Downloads:</span>
                      {sess.resources.map((res, rIdx) => (
                        <a key={rIdx} href={res.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-forge-accent hover:underline">
                          {res.title}
                        </a>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No sessions published yet.</p>
            )}
          </div>
        )}

        {/* SPEAKERS TAB */}
        {activeTab === 'speakers' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {speakers && speakers.length > 0 ? (
              speakers.map((spk) => (
                <Card key={spk._id} className="p-6 text-center border border-slate-200">
                  <img
                    src={spk.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={spk.name}
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-forge-accent shadow-forge-soft"
                  />
                  <h3 className="font-serif text-xl font-bold text-slate-900">{spk.name}</h3>
                  <p className="text-xs font-semibold text-forge-accent mt-0.5">{spk.title}</p>
                  <p className="text-xs text-slate-500">{spk.company}</p>
                  <p className="text-xs text-slate-600 my-4 line-clamp-3 leading-relaxed">{spk.bio}</p>

                  <div className="flex flex-wrap justify-center gap-1.5">
                    {spk.topicTags?.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] font-semibold bg-forge-warmGrey text-slate-700 px-2.5 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No speakers announced yet.</p>
            )}
          </div>
        )}

        {/* TICKETS TAB */}
        {activeTab === 'tickets' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tickets && tickets.length > 0 ? (
              tickets.map((tkt) => (
                <Card key={tkt._id} className="p-8 border border-slate-200 flex flex-col justify-between hover:border-forge-accent">
                  <div>
                    <Badge variant="accent">{tkt.name}</Badge>
                    <div className="mt-4 mb-2">
                      <span className="font-serif text-4xl font-bold text-slate-900">${tkt.price}</span>
                      <span className="text-xs text-slate-400"> / pass</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-6 leading-relaxed">{tkt.description}</p>
                    
                    <div className="space-y-2 text-xs text-slate-700 mb-8">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Access to Keynote Sessions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Encrypted Digital QR Badge</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Networking Lounge & Catering</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedTicket(tkt);
                      setCheckoutModalOpen(true);
                    }}
                    variant="primary"
                    className="w-full"
                  >
                    Select {tkt.name}
                  </Button>
                </Card>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No ticket passes available.</p>
            )}
          </div>
        )}

        {/* SPONSORS TAB */}
        {activeTab === 'sponsors' && (
          <div className="space-y-12 max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-bold text-slate-900 text-center">Summit Partners & Sponsors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sponsors && sponsors.length > 0 ? (
                sponsors.map((sp) => (
                  <Card key={sp._id} className="p-6 flex items-center gap-6 border border-slate-200">
                    <img
                      src={sp.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'}
                      alt={sp.organizationName}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100"
                    />
                    <div>
                      <Badge variant="warning">{sp.packageId?.tier?.toUpperCase() || 'PLATINUM'}</Badge>
                      <h3 className="font-serif text-xl font-bold text-slate-900 mt-1">{sp.organizationName}</h3>
                      <a href={sp.website} target="_blank" rel="noreferrer" className="text-xs text-forge-accent font-semibold hover:underline">
                        {sp.website || 'Visit Partner Website'}
                      </a>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No sponsors listed.</p>
              )}
            </div>
          </div>
        )}

      </main>


      {/* TICKET CHECKOUT MODAL */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Complete Ticket Registration"
        subtitle={event.title}
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          
          {selectedTicket && (
            <div className="p-4 rounded-2xl bg-forge-warmGrey/60 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-slate-900">{selectedTicket.name}</span>
                <span className="font-serif font-bold text-lg text-forge-accent">${selectedTicket.price}</span>
              </div>
              <p className="text-xs text-slate-500">{selectedTicket.description}</p>
            </div>
          )}

          {/* Coupon Code Entry */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Promo / Coupon Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Try FORGE20 for 20% off"
                className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-forge-accent uppercase"
              />
              <Button size="sm" variant="secondary" onClick={handleValidateCoupon}>
                Apply
              </Button>
            </div>
            {couponApplied && (
              <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Coupon '{couponApplied.code}' Applied ({couponApplied.discountValue}% Off)
              </p>
            )}
            {couponError && <p className="text-xs text-rose-600 font-medium">{couponError}</p>}
          </div>

          {/* Order Summary */}
          <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${selectedTicket?.price || 0}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount</span>
                <span>-${selectedTicket.price - calculateFinalPrice()}</span>
              </div>
            )}
            <div className="flex justify-between font-serif font-bold text-base text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Amount Paid</span>
              <span className="text-forge-accent">${calculateFinalPrice()}</span>
            </div>
          </div>

          {checkoutError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
              {checkoutError}
            </div>
          )}

          <Button
            onClick={handleCompleteRegistration}
            disabled={purchasing || !selectedTicket}
            variant="primary"
            className="w-full"
            icon={Ticket}
          >
            {purchasing ? 'Processing Order...' : 'Confirm Registration Pass'}
          </Button>

        </div>
      </Modal>

    </div>
  );
};
