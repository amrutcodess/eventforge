import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { QRScannerModal } from '../../components/QRScannerModal';
import { QrCode, CheckCircle2, UserCheck, Clock, Search, Calendar } from 'lucide-react';
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

  const columns = [
    {
      header: 'Delegate / Attendee',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.attendeeId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
            alt={row.attendeeId?.fullName || 'Attendee'}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <div>
            <p className="font-semibold text-slate-900 text-xs">{row.attendeeId?.fullName || 'Registered Delegate'}</p>
            <p className="text-[10px] text-slate-400">{row.attendeeId?.email}</p>
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
      accessor: (row) => <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded">{row.qrCodeToken}</span>
    },
    {
      header: 'Registration',
      accessor: (row) => (
        <Badge variant={row.status === 'confirmed' ? 'success' : row.status === 'waitlisted' ? 'warning' : 'dark'}>
          {row.status || 'confirmed'}
        </Badge>
      )
    },
    {
      header: 'Check-in Status',
      accessor: (row) => (
        <Badge variant={row.checkedIn ? 'success' : 'dark'}>
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
          className="text-xs font-bold text-forge-accent hover:underline disabled:text-slate-300 disabled:no-underline disabled:cursor-not-allowed"
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
          <h1 className="font-serif text-3xl font-bold text-slate-900 mt-1">Live Check-in & Desk Operations</h1>
        </div>
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-slate-900">No Events Assigned</h3>
          <p className="text-xs text-slate-500 mt-1">
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
          <h1 className="font-serif text-3xl font-bold text-slate-900 mt-1">Live Check-in & Desk Operations</h1>
          <p className="text-xs text-slate-500">Scan QR tickets, verify delegate badges, and track session entrance rates</p>
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
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Active Event:</span>
          {events.map((evt) => (
            <button
              key={evt._id}
              onClick={() => handleSelectEvent(evt)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold border transition-all shrink-0 ${
                selectedEvent?._id === evt._id
                  ? 'bg-forge-accent text-white border-forge-accent shadow-forge-soft'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {evt.title}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-xs text-slate-500">Total Delegates Registered</p>
          <p className="font-serif text-3xl font-bold text-slate-900 mt-2">{registrations.length}</p>
        </Card>

        <Card className="p-6">
          <p className="text-xs text-slate-500">On-Site Checked-in</p>
          <p className="font-serif text-3xl font-bold text-emerald-600 mt-2">{checkedInCount}</p>
        </Card>

        <Card className="p-6">
          <p className="text-xs text-slate-500">Pending Entrance</p>
          <p className="font-serif text-3xl font-bold text-slate-400 mt-2">{registrations.length - checkedInCount}</p>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-serif text-xl font-bold text-slate-900">Delegate Check-in Roster</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, QR token..."
              className="bg-white border border-slate-200 rounded-full pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-forge-accent w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
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
