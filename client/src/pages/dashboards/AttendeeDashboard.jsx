import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Ticket, QrCode, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import api from '../../utils/api';

export const AttendeeDashboard = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRegistrations();
  }, []);

  const fetchMyRegistrations = async () => {
    try {
      const res = await api.get('/registrations/my-all');
      setRegistrations(res.data);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <Badge variant="success">ATTENDEE PORTAL SHELL</Badge>
        <h1 className="font-display text-h2 uppercase text-ink mt-1">My Registered Events & Badges</h1>
        <p className="text-body-sm text-ink-muted">Access your digital QR tickets, view session schedules, and submit event feedback</p>
      </div>

      {loading ? (
        <div className="h-64 rounded-md bg-surface-muted animate-pulse" />
      ) : registrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {registrations.map((reg) => (
            <Card key={reg._id} className="p-6 flex flex-col justify-between hover:border-accent">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="accent">{reg.ticketCategoryId?.name || 'VIP Pass'}</Badge>
                  <span className="font-mono text-xs text-ink-muted">#{reg.orderNumber}</span>
                </div>

                <h3 className="text-h3 font-semibold text-ink">
                  {reg.eventId?.title || 'Global AI Summit 2026'}
                </h3>

                <div className="my-4 p-4 rounded-md bg-surface-muted border border-line flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink-muted font-medium">Entrance QR Token</p>
                    <p className="font-mono text-xs text-accent font-bold mt-0.5">{reg.qrCodeToken}</p>
                  </div>
                  {reg.qrCodeDataUri && (
                    <img src={reg.qrCodeDataUri} alt="QR Token" className="w-14 h-14 rounded-sm border border-line bg-surface p-1" />
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-line">
                <Badge variant={reg.checkedIn ? 'success' : 'neutral'}>
                  {reg.checkedIn ? 'CHECKED IN' : 'CONFIRMED PASS'}
                </Badge>

                <Link to={`/ticket-pass/${reg._id}`}>
                  <Button variant="primary" size="sm" icon={QrCode}>
                    View Digital Badge Pass
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Ticket className="w-12 h-12 text-ink-muted mx-auto mb-3" />
          <h3 className="text-h3 font-semibold text-ink">No Registrations Yet</h3>
          <p className="text-body-sm text-ink-muted mt-1 mb-6">Explore our flagship conferences to reserve your ticket pass.</p>
          <Link to="/">
            <Button variant="primary" size="sm">Discover Events</Button>
          </Link>
        </Card>
      )}
    </div>
  );
};
