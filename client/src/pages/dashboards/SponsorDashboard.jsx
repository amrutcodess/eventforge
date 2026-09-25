import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Award, CheckCircle2, Clock, Upload, ExternalLink } from 'lucide-react';

export const SponsorDashboard = () => {
  const [deliverables, setDeliverables] = useState([
    { _id: 'd1', title: 'High-Res Vector Brand Logo (SVG/EPS)', description: 'For keynote backdrop and badge lanyard printing', status: 'approved', dueDate: '2026-10-01', fileUrl: 'https://synthetix.cloud/logo.svg' },
    { _id: 'd2', title: '15-second Mainstage Video Reel (MP4)', description: 'Looping during keynote intermissions', status: 'submitted', dueDate: '2026-10-05', fileUrl: 'https://synthetix.cloud/reel.mp4' },
    { _id: 'd3', title: 'Exhibition Booth Floor Plan Sign-off', description: '20x20 feet expo footprint design dimensions', status: 'pending', dueDate: '2026-10-08', fileUrl: '' }
  ]);

  const handleSimulateUpload = (id) => {
    setDeliverables(deliverables.map(d => d._id === id ? { ...d, status: 'submitted', fileUrl: 'https://example.com/asset-uploaded.pdf' } : d));
  };

  const columns = [
    {
      header: 'Deliverable Asset',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{row.title}</p>
          <p className="text-[10px] text-slate-400">{row.description}</p>
        </div>
      )
    },
    {
      header: 'Due Date',
      accessor: (row) => <span className="text-xs text-slate-600 font-mono">{row.dueDate}</span>
    },
    {
      header: 'Review Status',
      accessor: (row) => (
        <Badge variant={row.status === 'approved' ? 'success' : row.status === 'submitted' ? 'info' : 'warning'}>
          {row.status.toUpperCase()}
        </Badge>
      )
    },
    {
      header: 'Asset File',
      accessor: (row) => (
        row.fileUrl ? (
          <a href={row.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-forge-accent hover:underline flex items-center gap-1">
            <span>View File</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <button
            onClick={() => handleSimulateUpload(row._id)}
            className="text-xs font-semibold text-forge-accent hover:underline flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            <span>Upload File</span>
          </button>
        )
      )
    }
  ];

  return (
    <div className="space-y-8 font-sans">
      <div>
        <Badge variant="dark">SPONSOR PARTNER SHELL</Badge>
        <h1 className="font-serif text-3xl font-bold text-slate-900 mt-1">Sponsor Partner Workspace</h1>
        <p className="text-xs text-slate-500">Track package entitlements, submit brand collateral, and verify booth deliverables</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border border-slate-200">
          <Badge variant="warning">PLATINUM PARTNER</Badge>
          <h3 className="font-serif text-xl font-bold text-slate-900 mt-3">Synthetix Cloud</h3>
          <p className="text-xs text-slate-500 mt-1">Titanium Sponsorship Package ($15,000)</p>
        </Card>

        <Card className="p-6 border border-slate-200">
          <p className="text-xs text-slate-500">Deliverables Approved</p>
          <p className="font-serif text-3xl font-bold text-emerald-600 mt-2">
            {deliverables.filter(d => d.status === 'approved').length} / {deliverables.length}
          </p>
        </Card>

        <Card className="p-6 border border-slate-200">
          <p className="text-xs text-slate-500">Allocated VIP Passes</p>
          <p className="font-serif text-3xl font-bold text-slate-900 mt-2">10 Passes</p>
        </Card>
      </div>

      <Card className="p-6 border border-slate-200 space-y-4">
        <h2 className="font-serif text-xl font-bold text-slate-900">Brand Deliverables & Assets Tracker</h2>
        <DataTable columns={columns} data={deliverables} />
      </Card>
    </div>
  );
};
