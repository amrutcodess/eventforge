import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Award, Upload, ExternalLink, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';
import api from '../../utils/api';

// Each sponsorship renders its own approved count, so the count-up lives in a small
// presentational child rather than in a loop (hooks cannot be called per-iteration).
const ApprovedStat = ({ approved, total }) => {
  const animated = useCountUp(approved);
  return (
    <p className="font-display text-h2 text-outline text-success tabular-nums mt-2">
      {Math.round(animated).toLocaleString()} / {total}
    </p>
  );
};

export const SponsorDashboard = () => {
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [status, setStatus] = useState(null);

  const fileInputRef = useRef(null);
  const pendingRef = useRef(null); // { sponsorship, deliverable }

  useEffect(() => {
    fetchSponsorships();
  }, []);

  const fetchSponsorships = async () => {
    try {
      const res = await api.get('/sponsors/me');
      setSponsorships(res.data || []);
    } catch (err) {
      console.error('Failed to load sponsorships:', err);
      setStatus({ type: 'error', message: 'Could not load your sponsorship records.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = (sponsorship, deliverable) => {
    pendingRef.current = { sponsorship, deliverable };
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    const pending = pendingRef.current;
    e.target.value = '';
    if (!file || !pending) return;

    const { sponsorship, deliverable } = pending;
    setUploadingId(deliverable._id);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/upload', formData);

      const eventId = sponsorship.eventId?._id || sponsorship.eventId;
      await api.put(
        `/events/${eventId}/sponsors/${sponsorship._id}/deliverables/${deliverable._id}`,
        { fileUrl: uploadRes.data.fileUrl, status: 'submitted' }
      );

      setSponsorships((prev) =>
        prev.map((s) =>
          s._id === sponsorship._id
            ? {
                ...s,
                deliverables: s.deliverables.map((d) =>
                  d._id === deliverable._id
                    ? { ...d, fileUrl: uploadRes.data.fileUrl, status: 'submitted' }
                    : d
                )
              }
            : s
        )
      );
      setStatus({ type: 'success', message: `"${deliverable.title}" submitted for organizer review.` });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.error || 'Upload failed. Please try again.'
      });
    } finally {
      setUploadingId(null);
      pendingRef.current = null;
    }
  };

  const buildColumns = (sponsorship) => [
    {
      header: 'Deliverable Asset',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-ink text-xs">{row.title}</p>
          <p className="text-[10px] text-ink-muted">{row.description}</p>
        </div>
      )
    },
    {
      header: 'Due Date',
      accessor: (row) => (
        <span className="text-xs text-ink-muted font-mono">
          {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Review Status',
      accessor: (row) => (
        <Badge
          variant={
            row.status === 'approved'
              ? 'success'
              : row.status === 'rejected'
              ? 'danger'
              : row.status === 'submitted'
              ? 'info'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Asset File',
      accessor: (row) =>
        row.fileUrl ? (
          <div className="flex items-center gap-3">
            <a
              href={row.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>View File</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => handleUploadClick(sponsorship, row)}
              disabled={uploadingId === row._id}
              className="text-[10px] font-semibold text-ink-muted hover:text-accent disabled:opacity-50"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleUploadClick(sponsorship, row)}
            disabled={uploadingId === row._id}
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            <span>{uploadingId === row._id ? 'Uploading...' : 'Upload File'}</span>
          </button>
        )
    }
  ];

  if (loading) {
    return <div className="h-64 rounded-md bg-surface-muted animate-pulse" />;
  }

  if (sponsorships.length === 0) {
    return (
      <div className="space-y-8 font-sans">
        <div>
          <Badge variant="neutral">SPONSOR PARTNER</Badge>
          <h1 className="font-display text-h2 uppercase text-ink mt-1">Sponsor Partner Workspace</h1>
        </div>
        <Card className="p-12 text-center">
          <Award className="w-12 h-12 text-ink-muted mx-auto mb-3" />
          <h3 className="text-h3 font-semibold text-ink">No Sponsorship Linked</h3>
          <p className="text-body-sm text-ink-muted mt-1">
            Your account is not linked to a sponsorship package yet. An event organizer can assign one
            from the sponsor roster.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div>
        <Badge variant="neutral">SPONSOR PARTNER</Badge>
        <h1 className="font-display text-h2 uppercase text-ink mt-1">Sponsor Partner Workspace</h1>
        <p className="text-body-sm text-ink-muted">
          Track package entitlements, submit brand collateral, and verify booth deliverables
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.ppt,.pptx,.doc,.docx,image/*,video/mp4"
        onChange={handleFileSelected}
      />

      {status && (
        <div
          className={`p-4 rounded-md text-xs font-semibold flex items-center gap-2 border ${
            status.type === 'success'
              ? 'bg-success-soft border-success/30 text-success'
              : 'bg-danger-soft border-danger/30 text-danger'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {sponsorships.map((sponsorship) => {
        const deliverables = sponsorship.deliverables || [];
        const approved = deliverables.filter((d) => d.status === 'approved').length;
        const pkg = sponsorship.packageId;

        return (
          <div key={sponsorship._id} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <Badge variant="warning">{pkg?.tier?.toUpperCase() || 'PARTNER'}</Badge>
                <h3 className="text-h3 font-semibold text-ink mt-3">
                  {sponsorship.organizationName}
                </h3>
                <p className="text-body-sm text-ink-muted mt-1">
                  {pkg?.name || 'Sponsorship Package'}
                  {pkg?.price != null ? ` ($${pkg.price.toLocaleString()})` : ''}
                </p>
                {sponsorship.eventId?.title && (
                  <p className="text-[10px] text-ink-muted mt-2">{sponsorship.eventId.title}</p>
                )}
              </Card>

              <Card className="p-6">
                <p className="text-body-sm text-ink-muted">Deliverables Approved</p>
                <ApprovedStat approved={approved} total={deliverables.length} />
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-accent" />
                  <p className="text-body-sm text-ink-muted">Package Entitlements</p>
                </div>
                {pkg?.benefits?.length > 0 ? (
                  <ul className="space-y-1">
                    {pkg.benefits.map((benefit, i) => (
                      <li key={i} className="text-[11px] text-ink-muted flex items-start gap-1.5">
                        <CheckCircle className="w-3 h-3 text-success mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-ink-muted">No entitlements listed.</p>
                )}
              </Card>
            </div>

            <Card className="p-6 space-y-4">
              <h2 className="text-h3 font-semibold text-ink">
                Brand Deliverables & Assets Tracker
              </h2>
              <DataTable
                columns={buildColumns(sponsorship)}
                data={deliverables}
                emptyMessage="No deliverables assigned to this package yet"
              />
            </Card>

          </div>
        );
      })}
    </div>
  );
};
