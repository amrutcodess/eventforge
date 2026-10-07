import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { AIModal } from '../../components/AIModal';
import { Calendar, Plus, Sparkles, Clock, AlertTriangle, Users, DollarSign, BarChart2, CheckCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartTheme, chartTooltipStyle } from '../../lib/chartTheme';
import { useCountUp } from '../../hooks/useCountUp';
import api from '../../utils/api';

export const OrganizerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [sessionStats, setSessionStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Session Modal & Form (Scheduler Conflict Detection test!)
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sTitle, setSTitle] = useState('');
  const [sSummary, setSSummary] = useState('');
  const [sRoom, setSRoom] = useState('Grand Imperial Ballroom');
  const [sTrack, setSTrack] = useState('Keynote');
  const [sStartTime, setSStartTime] = useState('2026-10-10T09:00');
  const [sEndTime, setSEndTime] = useState('2026-10-10T10:30');
  const [sError, setSError] = useState('');

  useEffect(() => {
    fetchManagedEvents();
  }, []);

  const fetchManagedEvents = async () => {
    try {
      const res = await api.get('/events/manage/all');
      setEvents(res.data);
      if (res.data.length > 0) {
        handleSelectEvent(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = async (evt) => {
    setSelectedEvent(evt);
    try {
      const [ovRes, timeRes, sessRes] = await Promise.all([
        api.get(`/events/${evt._id}/analytics/overview`),
        api.get(`/events/${evt._id}/analytics/registrations-over-time`),
        api.get(`/events/${evt._id}/analytics/session-popularity`)
      ]);
      setAnalytics(ovRes.data);
      setTimelineData(timeRes.data);
      setSessionStats(sessRes.data);
    } catch (err) {
      console.error('Analytics load error:', err);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSError('');
    if (!selectedEvent) return;

    try {
      await api.post(`/events/${selectedEvent._id}/sessions`, {
        title: sTitle,
        summary: sSummary,
        roomName: sRoom,
        track: sTrack,
        startTime: new Date(sStartTime),
        endTime: new Date(sEndTime)
      });

      setSessionModalOpen(false);
      setSTitle('');
      setSSummary('');
      handleSelectEvent(selectedEvent);
    } catch (err) {
      setSError(err.response?.data?.error || 'Failed to create session');
    }
  };

  const animatedRegistrations = useCountUp(analytics?.totalRegistrations);

  return (
    <div className="space-y-8 font-sans">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="accent">ORGANIZER CONTROL CENTER</Badge>
          <h1 className="font-display text-h2 uppercase text-ink mt-1">Event Operations & Analytics</h1>
          <p className="text-body-sm text-ink-muted">Manage schedules, detect room conflicts, track revenues & launch AI draft copy</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="dark"
            size="sm"
            onClick={() => setAiModalOpen(true)}
            icon={Sparkles}
          >
            AI Copywriting Studio
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setSessionModalOpen(true)}
            icon={Plus}
          >
            Add Session
          </Button>
        </div>
      </div>


      {/* Managed Event Selection Row */}
      {events.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider shrink-0">Active Event:</span>
          {events.map((evt) => (
            <button
              key={evt._id}
              onClick={() => handleSelectEvent(evt)}
              className={`px-4 py-2 rounded-sm text-xs font-semibold border transition-colors shrink-0 ${
                selectedEvent?._id === evt._id
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface text-ink-muted border-line hover:bg-canvas'
              }`}
            >
              {evt.title}
            </button>
          ))}
        </div>
      )}


      {/* KEY METRICS CARDS */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <Users className="w-7 h-7 text-accent" />
              <Badge variant="accent">CONFIRMED</Badge>
            </div>
            <p className="font-display text-h2 text-outline text-ink tabular-nums mt-4">{Math.round(animatedRegistrations).toLocaleString()}</p>
            <p className="text-body-sm text-ink-muted mt-1">Total Registrations</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <DollarSign className="w-7 h-7 text-accent" />
              <Badge variant="success">GROSS</Badge>
            </div>
            <p className="text-h2 font-semibold text-ink tabular-nums mt-4">${Number(analytics.totalRevenue).toLocaleString()}</p>
            <p className="text-body-sm text-ink-muted mt-1">Total Ticket Revenue</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <CheckCircle className="w-7 h-7 text-info" />
              <Badge variant="info">VERIFIED</Badge>
            </div>
            <p className="text-h2 font-semibold text-ink tabular-nums mt-4">{analytics.checkInRate}%</p>
            <p className="text-body-sm text-ink-muted mt-1">Check-in Rate ({analytics.checkedInCount} attended)</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <BarChart2 className="w-7 h-7 text-warning" />
              <Badge variant="warning">RATING</Badge>
            </div>
            <p className="text-h2 font-semibold text-ink tabular-nums mt-4">{analytics.avgFeedbackRating} / 5</p>
            <p className="text-body-sm text-ink-muted mt-1">Attendee Satisfaction</p>
          </Card>
        </div>
      )}


      {/* RECHARTS ANALYTICS VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Timeline Registration Growth Chart */}
        <Card className="lg:col-span-7 p-6">
          <h3 className="text-h3 font-semibold text-ink mb-4">Registration Velocity Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData.length > 0 ? timelineData : [{ date: 'Day 1', registrations: 12 }, { date: 'Day 2', registrations: 45 }, { date: 'Day 3', registrations: 89 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTheme.axis }} />
                <YAxis tick={{ fontSize: 11, fill: chartTheme.axis }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="registrations" stroke={chartTheme.accent} fill={chartTheme.accent} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Session Popularity Bar Chart */}
        <Card className="lg:col-span-5 p-6">
          <h3 className="text-h3 font-semibold text-ink mb-4">Session Attendance Saturation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionStats.length > 0 ? sessionStats : [{ title: 'Keynote', attendees: 120 }, { title: 'Cloud', attendees: 85 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="title" tick={{ fontSize: 10, fill: chartTheme.axis }} />
                <YAxis tick={{ fontSize: 11, fill: chartTheme.axis }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="attendees" fill={chartTheme.accent} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>


      {/* SESSION CONFLICT SCHEDULER MODAL */}
      <Modal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        title="Session Scheduler (Conflict Detection)"
        subtitle="Automatic room & time conflict resolution"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">

          {sError && (
            <div className="p-4 rounded-md bg-danger-soft border border-danger/30 text-danger text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
              <span>{sError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Session Title</label>
            <input
              type="text"
              value={sTitle}
              onChange={(e) => setSTitle(e.target.value)}
              required
              placeholder="e.g. Next-Gen Cloud Multi-Region Deployments"
              className="field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Venue Room</label>
              <select
                value={sRoom}
                onChange={(e) => setSRoom(e.target.value)}
                className="field"
              >
                <option value="Grand Imperial Ballroom">Grand Imperial Ballroom</option>
                <option value="Innovation Hall A">Innovation Hall A</option>
                <option value="Workshop Suite B">Workshop Suite B</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Track Category</label>
              <input
                type="text"
                value={sTrack}
                onChange={(e) => setSTrack(e.target.value)}
                placeholder="Keynote, AI, Cloud"
                className="field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={sStartTime}
                onChange={(e) => setSStartTime(e.target.value)}
                required
                className="field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">End Time</label>
              <input
                type="datetime-local"
                value={sEndTime}
                onChange={(e) => setSEndTime(e.target.value)}
                required
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Summary / Abstract</label>
            <textarea
              value={sSummary}
              onChange={(e) => setSSummary(e.target.value)}
              placeholder="Session abstract..."
              className="field h-20"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full">
            Save Session & Verify Schedule
          </Button>

        </form>
      </Modal>


      {/* AI COPY MODAL */}
      <AIModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onInsertDraft={(draft) => setSSummary(draft)}
      />

    </div>
  );
};
