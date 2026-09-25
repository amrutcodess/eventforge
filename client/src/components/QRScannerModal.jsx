import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { QrCode, CheckCircle, AlertCircle, Camera, Search, UserCheck } from 'lucide-react';
import api from '../utils/api';

export const QRScannerModal = ({ isOpen, onClose, eventId, onScanSuccess }) => {
  const [qrToken, setQrToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setScanResult(null);
      setErrorMsg('');
      setQrToken('');
    }
  }, [isOpen]);

  const handleManualCheckIn = async (e) => {
    e?.preventDefault();
    if (!qrToken.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setScanResult(null);

    try {
      const res = await api.post(`/events/${eventId || 'global-ai-cloud-summit-2026'}/check-in`, {
        qrToken: qrToken.trim()
      });

      setScanResult(res.data);
      if (onScanSuccess) onScanSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Check-in failed';
      setErrorMsg(msg);
      if (err.response?.data?.alreadyCheckedIn) {
        setScanResult(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Live QR Ticket Check-in Scanner"
      subtitle="Scan attendee QR badge token for rapid venue access"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        
        {/* Visual Scanner Area */}
        <div className="relative bg-slate-900 rounded-3xl p-6 text-white text-center flex flex-col items-center justify-center border border-slate-800">
          <div className="w-24 h-24 rounded-2xl bg-forge-accent/30 border-2 border-dashed border-emerald-400 flex items-center justify-center mb-3 animate-pulse">
            <QrCode className="w-12 h-12 text-emerald-400" />
          </div>
          <p className="text-xs text-slate-300 font-medium">Position attendee QR badge in front of camera or enter token code below</p>
          
          <div className="w-full mt-4 flex gap-2">
            <input
              type="text"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              placeholder="e.g. EF-REG-2026-998811"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <Button
              size="sm"
              onClick={handleManualCheckIn}
              disabled={loading || !qrToken.trim()}
              icon={Search}
            >
              Verify
            </Button>
          </div>
        </div>

        {/* Scan Result Feedback */}
        {scanResult && (
          <div className={`p-5 rounded-2xl border ${scanResult.alreadyCheckedIn ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'} animate-fade-in`}>
            <div className="flex items-start gap-3">
              {scanResult.alreadyCheckedIn ? (
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">
                    {scanResult.alreadyCheckedIn ? 'Attendee Already Checked In' : 'Check-in Verified Successfully!'}
                  </h4>
                  <Badge variant={scanResult.alreadyCheckedIn ? 'warning' : 'success'}>
                    {scanResult.alreadyCheckedIn ? 'Duplicate Scan' : 'ACCESS GRANTED'}
                  </Badge>
                </div>
                
                {scanResult.registration && (
                  <div className="mt-3 bg-white/70 rounded-xl p-3 text-xs space-y-1">
                    <p className="font-semibold text-slate-900 text-sm">
                      {scanResult.registration.attendeeId?.fullName || 'Registered Delegate'}
                    </p>
                    <p className="text-slate-600">{scanResult.registration.attendeeId?.email}</p>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-700">Ticket Tier:</span>
                      <span className="bg-forge-accent text-white px-2 py-0.5 rounded-full text-[10px]">
                        {scanResult.registration.ticketCategoryId?.name || 'VIP Pass'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {errorMsg && !scanResult?.alreadyCheckedIn && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

      </div>
    </Modal>
  );
};
