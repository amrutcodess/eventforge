import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { QrCode, CheckCircle, AlertCircle, Camera, Search, CameraOff } from 'lucide-react';
import api from '../utils/api';

const READER_ELEMENT_ID = 'ef-qr-reader';

export const QRScannerModal = ({ isOpen, onClose, eventId, onScanSuccess }) => {
  const [qrToken, setQrToken] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const scannerRef = useRef(null);
  // Guards against the camera firing the same code several times per second, and
  // against submitting while a previous check-in is still in flight.
  const busyRef = useRef(false);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // Scanner was already stopped or never fully started — nothing to clean up.
      }
    }
    setCameraActive(false);
  }, []);

  const submitToken = useCallback(async (token) => {
    const trimmed = token?.trim();
    if (!trimmed || busyRef.current) return;

    busyRef.current = true;
    setErrorMsg('');
    setScanResult(null);
    setLoading(true);

    try {
      const targetEventId = eventId;
      const res = await api.post(`/events/${targetEventId}/check-in`, { qrToken: trimmed });
      setScanResult(res.data);
      if (onScanSuccess) onScanSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Check-in failed';
      setErrorMsg(msg);
      if (err.response?.data?.alreadyCheckedIn) {
        setScanResult(err.response.data);
      }
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [eventId, onScanSuccess]);

  const handleManualCheckIn = async (e) => {
    e?.preventDefault();
    await submitToken(qrToken);
  };

  const startCamera = async () => {
    setCameraError('');
    setErrorMsg('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(READER_ELEMENT_ID);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          // Stop scanning immediately so a single badge isn't submitted repeatedly.
          await stopCamera();
          setQrToken(decodedText);
          submitToken(decodedText);
        },
        () => {
          // Per-frame decode misses are expected while the camera hunts for a code.
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera start failed:', err);
      // start() can fail partway (e.g. permission granted, then no suitable camera),
      // which would leave the MediaStream live and the camera light on.
      await stopCamera();
      setCameraError(
        'Unable to access the camera. Grant camera permission in your browser, or enter the badge token manually below.'
      );
    }
  };

  // Tear the camera down whenever the modal closes or the component unmounts; leaving
  // a MediaStream running keeps the camera light on.
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanResult(null);
      setErrorMsg('');
      setCameraError('');
      setQrToken('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Live QR Ticket Check-in Scanner"
      subtitle="Scan attendee QR badge token for rapid venue access"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">

        {/* Visual Scanner Area */}
        <div className="relative bg-slate-900 rounded-3xl p-6 text-white text-center flex flex-col items-center justify-center border border-slate-800">
          {/* The reader element must stay mounted and laid out at all times: html5-qrcode
              measures it to size the video feed, and a display:none element measures 0x0,
              which makes scanner.start() fail. The idle placeholder is an overlay instead. */}
          <div className="relative w-full max-w-xs min-h-[220px] rounded-2xl overflow-hidden bg-black/40 border border-slate-800 flex items-center justify-center">
            <div id={READER_ELEMENT_ID} className="w-full" />

            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-2xl bg-forge-accent/30 border-2 border-dashed border-emerald-400 flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-emerald-400" />
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-300 font-medium mt-3">
            {cameraActive
              ? 'Point the camera at the attendee QR badge'
              : 'Use the camera to scan, or enter the badge token code below'}
          </p>

          <div className="w-full mt-4 flex items-center justify-center">
            {cameraActive ? (
              <Button size="sm" variant="secondary" onClick={stopCamera} icon={CameraOff}>
                Stop Camera
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={startCamera} icon={Camera}>
                Start Camera Scan
              </Button>
            )}
          </div>

          {cameraError && (
            <p className="text-[11px] text-amber-300 mt-3 max-w-sm">{cameraError}</p>
          )}

          <div className="w-full mt-5 pt-5 border-t border-slate-800 flex gap-2">
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
                        {scanResult.registration.ticketCategoryId?.name || 'General'}
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
