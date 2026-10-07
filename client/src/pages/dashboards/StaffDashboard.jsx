import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { QRScannerModal } from '../../components/QRScannerModal';
import { QrCode, CheckCircle2, UserCheck, Clock, Search, Calendar } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';
import api from '../../utils/api';

export const StaffDashboard = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchManagedEvents();
  }, []);

  const fetchManagedEvents = async () => {
    try {
      const res = await api.get('/events/manage/all');
      setEvents(res.data);
      if (res.data.length > 0) {
        handleSelectEvent(res.data[0]);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch managed events:', err);
      setLoading(false);
    }
  };

  const handleSelectEvent = async (evt) => {
    setSelectedEvent(evt);
    setLoading(true);
    try {
      const res = await api.get(`/events/${evt._id}/registrations`);
      setRegistrations(res.data);
    } catch (err) {
      console.error('Failed to load registrations:', err);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualToggleCheckIn = async (regId, currentStatus) => {
    if (!selectedEvent) return;
    try {
      await api.put(`/events/${selectedEvent._id}/registrations/${regId}/check-in`, {
        checkedIn: !currentStatus
      });
      handleSelectEvent(selectedEvent);
    } catch (err) {
      console.error('Check-in status toggle error:', err);
    }
  };

  const filtered = registrations.filter(r => {
    const name = r.attendeeId?.fullName || '';
    const email = r.attendeeId?.email || '';
    const token = r.qrCodeToken || '';
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) ||
           email.toLowerCase().includes(term) ||
           token.toLowerCase().includes(term);
  });

  const checkedInCount = registrations.filter(r => r.checkedIn).length;

  const animatedDelegates = useCountUp(registrations.length);

  const columns = [
    {
      header: 'Delegate / Attendee',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.attendeeId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
            alt={row.attendeeId?.fullName || 'Attendee'}
            className="w-8 h-8 rounded-full object-cover border border-line"
          />
          <div>
            <p className="font-semibold text-ink text-xs">{row.attendeeId?.fullName || 'Registered Delegate'}</p>
            <p className="text-[10px] text-ink-muted">{row.attendeeId?.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Ticket Category',
      accessor: (row) => <Badge variant="accent">{row.ticketCategoryId?.name || 'General'}</Badge>
    },
    {
      header: 'QR Badge Token',
      accessor: (row) => <span className="font-mono text-[10px] text-ink-muted bg-surface-muted px-2 py-1 rounded-sm">{row.qrCodeToken}</span>
    },
    {
      header: 'Registration',
      accessor: (row) => (
        <Badge variant={row.status === 'confirmed' ? 'success' : row.status === 'waitlisted' ? 'warning' : 'neutral'}>
          {row.status || 'confirmed'}
        </Badge>
      )
    },
    {
      header: 'Check-in Status',
      accessor: (row) => (
        <Badge variant={row.checkedIn ? 'success' : 'neutral'}>
          {row.checkedIn ? 'CHECKED IN' : 'NOT CHECKED IN'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <button
          onClick={() => handleManualToggleCheckIn(row._id, row.checkedIn)}
          disabled={row.status !== 'confirmed'}
          className="text-xs font-bold text-accent hover:underline disabled:text-line-strong disabled:no-underline disabled:cursor-not-allowed"
        >
          {row.checkedIn ? 'Mark Unchecked' : 'Manual Check-in'}
        </button>
      )
    }
  ];

  if (!loading && events.length === 0) {
    return (
      <div className="space-y-8 font-sans">
        <div>
          <Badge variant="info">ON-SITE EVENT STAFF</Badge>
          <h1 className="font-display text-h2 uppercase text-ink mt-1">Live Check-in & Desk Operations</h1>
        </div>
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-ink-muted mx-auto mb-3" />
          <h3 className="text-h3 font-semibold text-ink">No Events Assigned</h3>
          <p className="text-body-sm text-ink-muted mt-1">
            You are not assigned as staff or organizer on any event yet. Ask an event organizer to add you to a staff roster.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="info">ON-SITE EVENT STAFF</Badge>
          <h1 className="font-display text-h2 uppercase text-ink mt-1">Live Check-in & Desk Operations</h1>
          <p className="text-body-sm text-ink-muted">Scan QR tickets, verify delegate badges, and track session entrance rates</p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setQrModalOpen(true)}
          disabled={!selectedEvent}
          icon={QrCode}
        >
          Launch QR Scanner
        </Button>
      </div>

      {/* Event Selector */}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-body-sm text-ink-muted">Total Delegates Registered</p>
          <p className="font-display text-h2 text-outline text-ink tabular-nums mt-2">{Math.round(animatedDelegates).toLocaleString()}</p>
        </Card>

        <Card className="p-6">
          <p className="text-body-sm text-ink-muted">On-Site Checked-in</p>
          <p className="text-h2 font-semibold text-success tabular-nums mt-2">{checkedInCount.toLocaleString()}</p>
        </Card>

        <Card className="p-6">
          <p className="text-body-sm text-ink-muted">Pending Entrance</p>
          <p className="text-h2 font-semibold text-ink-muted tabular-nums mt-2">{(registrations.length - checkedInCount).toLocaleString()}</p>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-h3 font-semibold text-ink">Delegate Check-in Roster</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, QR token..."
              className="field pl-9 pr-4 py-1.5 text-xs w-full sm:w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="h-64 rounded-md bg-surface-muted animate-pulse" />
        ) : (
          <DataTable columns={columns} data={filtered} emptyMessage="No registrations for this event yet" />
        )}
      </Card>

      <QRScannerModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        eventId={selectedEvent?._id}
        onScanSuccess={() => selectedEvent && handleSelectEvent(selectedEvent)}
      />

    </div>
  );
};
