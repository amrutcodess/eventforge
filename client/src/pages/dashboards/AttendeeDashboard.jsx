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
        <h1 className="font-serif text-3xl font-bold text-slate-900 mt-1">My Registered Events & Badges</h1>
        <p className="text-xs text-slate-500">Access your digital QR tickets, view session schedules, and submit event feedback</p>
      </div>

      {loading ? (
        <div className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
      ) : registrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {registrations.map((reg) => (
            <Card key={reg._id} className="p-6 border border-slate-200 flex flex-col justify-between hover:border-forge-accent">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="accent">{reg.ticketCategoryId?.name || 'VIP Pass'}</Badge>
                  <span className="font-mono text-xs text-slate-400">#{reg.orderNumber}</span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-slate-900">
                  {reg.eventId?.title || 'Global AI Summit 2026'}
                </h3>

                <div className="my-4 p-4 rounded-2xl bg-forge-warmGrey/60 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Entrance QR Token</p>
                    <p className="font-mono text-xs text-forge-accent font-bold mt-0.5">{reg.qrCodeToken}</p>
                  </div>
                  {reg.qrCodeDataUri && (
                    <img src={reg.qrCodeDataUri} alt="QR Token" className="w-14 h-14 rounded-lg border border-slate-200 bg-white p-1" />
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <Badge variant={reg.checkedIn ? 'success' : 'dark'}>
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
        <Card className="p-12 text-center border border-slate-200">
          <Ticket className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-slate-900">No Registrations Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">Explore our flagship conferences to reserve your ticket pass.</p>
          <Link to="/">
            <Button variant="primary" size="sm">Discover Events</Button>
          </Link>
        </Card>
      )}
    </div>
  );
};
