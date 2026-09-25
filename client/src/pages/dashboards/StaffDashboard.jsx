import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { QRScannerModal } from '../../components/QRScannerModal';
import { QrCode, CheckCircle2, UserCheck, Clock, Search } from 'lucide-react';
import api from '../../utils/api';

export const StaffDashboard = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await api.get('/events/global-ai-cloud-summit-2026/registrations');
      setRegistrations(res.data);
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualToggleCheckIn = async (regId, currentStatus) => {
    try {
      await api.put(`/events/global-ai-cloud-summit-2026/registrations/${regId}/status`, {
        checkedIn: !currentStatus
      });
      fetchRegistrations();
    } catch (err) {
      console.error('Check-in status toggle error:', err);
    }
  };

  const filtered = registrations.filter(r => {
    const name = r.attendeeId?.fullName || '';
    const email = r.attendeeId?.email || '';
    const token = r.qrCodeToken || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           token.toLowerCase().includes(searchTerm.toLowerCase());
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
      accessor: (row) => <Badge variant="accent">{row.ticketCategoryId?.name || 'VIP Pass'}</Badge>
    },
    {
      header: 'QR Badge Token',
      accessor: (row) => <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded">{row.qrCodeToken}</span>
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
          className="text-xs font-bold text-forge-accent hover:underline"
        >
          {row.checkedIn ? 'Mark Unchecked' : 'Manual Check-in'}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 font-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="info">ON-SITE EVENT STAFF SHELL</Badge>
          <h1 className="font-serif text-3xl font-bold text-slate-900 mt-1">Live Check-in & Desk Operations</h1>
          <p className="text-xs text-slate-500">Scan QR tickets, verify delegate badges, and track session entrance rates</p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setQrModalOpen(true)}
          icon={QrCode}
        >
          Launch QR Scanner
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 border border-slate-200">
          <p className="text-xs text-slate-500">Total Delegates Registered</p>
          <p className="font-serif text-3xl font-bold text-slate-900 mt-2">{registrations.length}</p>
        </Card>

        <Card className="p-6 border border-slate-200">
          <p className="text-xs text-slate-500">On-Site Checked-in</p>
          <p className="font-serif text-3xl font-bold text-emerald-600 mt-2">{checkedInCount}</p>
        </Card>

        <Card className="p-6 border border-slate-200">
          <p className="text-xs text-slate-500">Pending Entrance</p>
          <p className="font-serif text-3xl font-bold text-slate-400 mt-2">{registrations.length - checkedInCount}</p>
        </Card>
      </div>

      <Card className="p-6 border border-slate-200 space-y-4">
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

        <DataTable columns={columns} data={filtered} />
      </Card>

      <QRScannerModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        eventId="global-ai-cloud-summit-2026"
        onScanSuccess={() => fetchRegistrations()}
      />

    </div>
  );
};
