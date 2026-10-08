import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { EventBrief } from '../components/ai/EventBrief';
import { useAssistantContext } from '../context/AssistantContext';
import { Calendar, MapPin, Clock, Ticket, Check, ShieldCheck, FileText, Megaphone, Mic, Award } from 'lucide-react';
import api from '../utils/api';

export const EventDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setEvent: setAssistantEvent } = useAssistantContext();

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

      // Publish the event to the assistant widget, which is mounted outside the route and so
      // cannot read `useParams`. Passing the id (not the slug) means the server can resolve it
      // against the caller's real permissions without a second lookup.
      setAssistantEvent({ id: res.data.event._id, title: res.data.event.title });

      if (res.data.userPermissions?.isAttendee) {
        fetchMySessions(res.data.event._id);
      }
    } catch (err) {
      console.error('Failed to load event:', err);
    } finally {
      setLoading(false);
    }
  };

  // Clear the published event when leaving, so the assistant stops scoping its answers to an
  // event the visitor is no longer looking at.
  useEffect(() => () => setAssistantEvent(null), [setAssistantEvent]);

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
      <div className="flex min-h-screen items-center justify-center bg-canvas p-8">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!eventData?.event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-8">
        <h2 className="font-display text-display uppercase text-ink">Event not found</h2>
        <Button className="mt-6" onClick={() => navigate('/')}>Return to Events</Button>
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
    <div className="min-h-screen bg-canvas pb-24 text-ink">
      {/* ── EVENT HERO — dark band ── */}
      <section className="relative overflow-hidden bg-night py-20 text-white md:py-28">
        {/* The banner was previously dimmed three times over — opacity-20 *and* blur-sm
            *and* a heavy gradient — which left the photograph contributing ~8% brightness,
            i.e. an unreadable smudge. One dimmer is enough: a moderate opacity with a
            gradient that only goes dark where the headline actually sits. */}
        <div className="absolute inset-0 opacity-50">
          <img
            src={event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80'}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/85 to-night/35" />

        <div className="gutter relative">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="accent">{event.category.toUpperCase()}</Badge>
              <span className="eyebrow text-white/50">
                {event.orgId?.name || 'Nexus Enterprise'}
              </span>
            </div>

            <h1 className="mt-6 font-display text-display uppercase leading-none text-white">
              {event.title}
            </h1>

            <p className="mt-6 max-w-2xl text-body-lg text-white/70">
              {event.tagline || event.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-8 border-t border-night-line pt-6 text-sm text-white/70">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
                {new Date(event.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                {event.venueId?.name}, {event.venueId?.city}
              </span>
            </div>

            {userPermissions?.isAttendee && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-md bg-success-soft p-4 text-xs text-success">
                <span className="inline-flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-5 w-5" />
                  You have a confirmed registration pass for this summit.
                </span>
                <Button size="sm" variant="primary" onClick={() => navigate('/ticket-pass/my')}>
                  View Badge &amp; QR Pass
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ANNOUNCEMENTS — light band ── */}
      {announcements.length > 0 && (
        <section className="bg-canvas">
          <div className="gutter space-y-3 py-8">
            {announcements.slice(0, 3).map((ann) => (
              <div
                key={ann._id}
                className="flex items-start gap-3 rounded-md border border-line bg-surface p-4"
              >
                <Megaphone
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    ann.priority === 'urgent' ? 'text-danger' : 'text-accent'
                  }`}
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{ann.title}</h3>
                    {ann.priority === 'urgent' && <Badge variant="danger">Urgent</Badge>}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{ann.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── AI EVENT BRIEF — light band. Renders nothing if it cannot load, so the page
             below never depends on it. ── */}
      <EventBrief eventId={event._id} />

      {/* ── TAB BAR. `top-20` is coupled to the Navbar's `h-20` — keep them in sync. ── */}
      <section className="sticky top-20 z-30 border-b border-line bg-canvas">
        <div className="gutter">
          <div className="flex items-center justify-between gap-6">
            <div className="no-scrollbar flex min-w-0 gap-6 overflow-x-auto whitespace-nowrap text-sm font-medium">
              {[
                { id: 'agenda', label: `Session Schedule (${sessions?.length || 0})` },
                { id: 'speakers', label: `Keynote Speakers (${speakers?.length || 0})` },
                { id: 'tickets', label: `Ticket Passes (${tickets?.length || 0})` },
                { id: 'sponsors', label: `Partners & Sponsors (${sponsors?.length || 0})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 py-4 transition-colors ${
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-ink-muted hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="shrink-0 py-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (tickets?.length > 0) setSelectedTicket(tickets[0]);
                  setCheckoutModalOpen(true);
                }}
              >
                Get Tickets
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main className="gutter py-16">
        {/* AGENDA */}
        {activeTab === 'agenda' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-h2 font-bold tracking-tight text-ink">
                Summit program &amp; masterclasses
              </h2>
              {userPermissions?.isAttendee && (
                <p className="mt-2 text-xs text-ink-muted">
                  {selectedSessionIds.length > 0
                    ? `You have ${selectedSessionIds.length} session${selectedSessionIds.length === 1 ? '' : 's'} in your personal schedule.`
                    : 'Add sessions to your personal schedule to build your agenda.'}
                </p>
              )}
              {selectionError && (
                <p className="mt-2 text-xs font-medium text-danger">{selectionError}</p>
              )}
            </div>

            {sessions && sessions.length > 0 ? (
              sessions.map((sess) => (
                <Card key={sess._id} className="p-6">
                  <div className="flex flex-col justify-between gap-4 border-b border-line pb-4 md:flex-row md:items-center">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <Badge variant="accent">{sess.track.toUpperCase()}</Badge>
                        <span className="text-xs text-ink-muted">Room: {sess.roomName}</span>
                      </div>
                      <h3 className="text-h3 font-semibold text-ink">{sess.title}</h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-sm bg-canvas px-4 py-2 text-xs font-semibold text-ink-muted">
                        <Clock className="h-4 w-4 text-accent" />
                        {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {new Date(sess.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {userPermissions?.isAttendee && (
                        <button
                          onClick={() => toggleSessionSelection(sess._id)}
                          className={`inline-flex items-center gap-1.5 rounded-none px-4 py-2 text-xs font-semibold transition-colors ${
                            selectedSessionIds.includes(sess._id)
                              ? 'bg-accent text-white'
                              : 'border border-line-strong text-ink-muted hover:border-ink hover:text-ink'
                          }`}
                        >
                          {selectedSessionIds.includes(sess._id) && <Check className="h-3.5 w-3.5" />}
                          {selectedSessionIds.includes(sess._id) ? 'In My Schedule' : 'Add to Schedule'}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="my-4 text-xs leading-relaxed text-ink-muted">
                    {sess.summary || sess.description}
                  </p>

                  {sess.speakerIds && sess.speakerIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {sess.speakerIds.map((spk) => (
                        <div
                          key={spk._id}
                          className="flex items-center gap-2 rounded-sm border border-line bg-canvas px-3 py-1.5"
                        >
                          <img
                            src={spk.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={spk.name}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                          <span className="text-xs font-semibold text-ink">{spk.name}</span>
                          <span className="text-[10px] text-ink-muted">({spk.company})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {sess.resources && sess.resources.length > 0 && (
                    <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
                      <FileText className="h-4 w-4 text-accent" />
                      <span className="text-xs text-ink-muted">Session downloads:</span>
                      {sess.resources.map((res, rIdx) => (
                        <a
                          key={rIdx}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          {res.title}
                        </a>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <EmptyState
                icon={Calendar}
                title="No sessions published yet"
                body="The programme for this event has not been released. Sessions will appear here as soon as the organizer publishes them."
              />
            )}
          </div>
        )}

        {/* SPEAKERS */}
        {activeTab === 'speakers' && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {speakers && speakers.length > 0 ? (
              speakers.map((spk) => (
                <Card key={spk._id} className="p-6 text-center">
                  <img
                    src={spk.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={spk.name}
                    className="mx-auto mb-4 h-24 w-24 rounded-full border-2 border-accent object-cover"
                  />
                  <h3 className="text-h3 font-semibold text-ink">{spk.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-accent">{spk.title}</p>
                  <p className="text-xs text-ink-muted">{spk.company}</p>
                  <p className="my-4 line-clamp-3 text-xs leading-relaxed text-ink-muted">
                    {spk.bio}
                  </p>

                  <div className="flex flex-wrap justify-center gap-1.5">
                    {spk.topicTags?.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="rounded-sm bg-canvas px-2.5 py-1 text-[10px] font-medium text-ink-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={Mic}
                title="No speakers announced yet"
                body="Speaker profiles appear here once they are added to the programme, along with the sessions they are on."
              />
            )}
          </div>
        )}

        {/* TICKETS */}
        {activeTab === 'tickets' && (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {tickets && tickets.length > 0 ? (
              tickets.map((tkt) => {
                // Real availability, straight off the tier. This replaced three bullet points —
                // "Access to keynote sessions", "Encrypted digital QR badge", "Networking lounge
                // & catering" — that were hardcoded and therefore printed identically under a
                // $499 executive pass and a $149 lab pass, contradicting the tier's own
                // description directly above them.
                const hasCapacity = typeof tkt.capacity === 'number';
                const remaining = hasCapacity
                  ? Math.max(tkt.capacity - (tkt.quantitySold || 0), 0)
                  : null;
                const soldOut = hasCapacity && remaining === 0;

                return (
                  <Card key={tkt._id} className="flex flex-col justify-between p-8">
                    <div>
                      <Badge variant="accent">{tkt.name}</Badge>
                      <div className="mb-2 mt-5 flex items-baseline gap-2">
                        <span className="font-display text-4xl text-outline text-ink">
                          ${tkt.price}
                        </span>
                        <span className="text-xs text-ink-muted">/ pass</span>
                      </div>
                      <p className="mb-6 text-xs leading-relaxed text-ink-muted">
                        {tkt.description}
                      </p>

                      <div className="mb-8 space-y-2 text-xs text-ink-muted">
                        {hasCapacity && (
                          <p className="flex items-center gap-2">
                            <Check className="h-4 w-4 shrink-0 text-accent" />
                            {soldOut
                              ? 'Sold out'
                              : `${remaining} of ${tkt.capacity} seats remaining`}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Check className="h-4 w-4 shrink-0 text-accent" />
                          Unique QR pass issued on registration
                        </p>
                        <p className="flex items-center gap-2">
                          <Check className="h-4 w-4 shrink-0 text-accent" />
                          {tkt.requiresApproval
                            ? 'Registration requires organizer approval'
                            : 'Confirmed instantly on checkout'}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedTicket(tkt);
                        setCheckoutModalOpen(true);
                      }}
                      disabled={soldOut}
                      variant="primary"
                      className="w-full"
                    >
                      {soldOut ? `${tkt.name} — sold out` : `Select ${tkt.name}`}
                    </Button>
                  </Card>
                );
              })
            ) : (
              <EmptyState
                icon={Ticket}
                title="No passes on sale yet"
                body="Ticket tiers have not been published for this event. They will appear here once registration opens."
              />
            )}
          </div>
        )}

        {/* SPONSORS */}
        {activeTab === 'sponsors' && (
          <div className="mx-auto max-w-4xl space-y-12">
            <h2 className="text-center text-h2 font-bold tracking-tight text-ink">
              Summit partners &amp; sponsors
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {sponsors && sponsors.length > 0 ? (
                sponsors.map((sp) => (
                  <Card key={sp._id} className="flex items-center gap-6 p-6">
                    <img
                      src={sp.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'}
                      alt={sp.organizationName}
                      className="h-16 w-16 rounded-md border border-line object-cover"
                    />
                    <div>
                      <Badge variant="warning">
                        {sp.packageId?.tier?.toUpperCase() || 'PLATINUM'}
                      </Badge>
                      <h3 className="mt-2 text-h3 font-semibold text-ink">
                        {sp.organizationName}
                      </h3>
                      <a
                        href={sp.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        {sp.website || 'Visit partner website'}
                      </a>
                    </div>
                  </Card>
                ))
              ) : (
                <EmptyState
                  icon={Award}
                  title="No sponsors listed"
                  body="Partner packages for this event have not been published yet."
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── CHECKOUT MODAL ── */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Complete Ticket Registration"
        subtitle={event.title}
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          {selectedTicket && (
            <div className="space-y-2 rounded-md border border-line bg-canvas p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{selectedTicket.name}</span>
                <span className="font-semibold text-accent">${selectedTicket.price}</span>
              </div>
              <p className="text-xs text-ink-muted">{selectedTicket.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="eyebrow block text-ink-muted">Promo / Coupon Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Try FORGE20 for 20% off"
                className="field flex-1 uppercase"
              />
              <Button size="sm" variant="secondary" onClick={handleValidateCoupon}>
                Apply
              </Button>
            </div>
            {couponApplied && (
              <p className="flex items-center gap-1 text-xs font-semibold text-success">
                <Check className="h-3.5 w-3.5" /> Coupon '{couponApplied.code}' applied ({couponApplied.discountValue}% off)
              </p>
            )}
            {couponError && <p className="text-xs font-medium text-danger">{couponError}</p>}
          </div>

          <div className="space-y-2 border-t border-line pt-4 text-xs">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal</span>
              <span>${selectedTicket?.price || 0}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between font-medium text-success">
                <span>Discount</span>
                <span>-${selectedTicket.price - calculateFinalPrice()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
              <span>Total amount paid</span>
              <span className="text-accent">${calculateFinalPrice()}</span>
            </div>
          </div>

          {checkoutError && (
            <div className="rounded-md bg-danger-soft p-3 text-xs font-medium text-danger">
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
            {purchasing ? 'Processing order…' : 'Confirm Registration Pass'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
