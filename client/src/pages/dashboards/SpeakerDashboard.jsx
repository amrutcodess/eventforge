import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { User, Clock, FileText, Upload, Save, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

export const SpeakerDashboard = () => {
  const [profiles, setProfiles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message }
  const [uploadingFor, setUploadingFor] = useState(null);

  const fileInputRef = useRef(null);
  const pendingSessionRef = useRef(null);

  useEffect(() => {
    fetchSpeakerData();
  }, []);

  const fetchSpeakerData = async () => {
    try {
      const res = await api.get('/speakers/me');
      setProfiles(res.data.speakerProfiles || []);
      setSessions(res.data.sessions || []);
      setBio(res.data.speakerProfiles?.[0]?.bio || '');
    } catch (err) {
      console.error('Failed to load speaker profile:', err);
      setStatus({ type: 'error', message: 'Could not load your speaker profile.' });
    } finally {
      setLoading(false);
    }
  };

  const activeProfile = profiles[0];

  const handleSaveProfile = async () => {
    if (!activeProfile) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await api.put(
        `/events/${activeProfile.eventId?._id || activeProfile.eventId}/speakers/${activeProfile._id}`,
        { bio }
      );
      setProfiles((prev) => prev.map((p) => (p._id === res.data._id ? { ...p, bio: res.data.bio } : p)));
      setStatus({ type: 'success', message: 'Speaker profile updated.' });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.error || 'Failed to save your profile.'
      });
    } finally {
      setSaving(false);
    }
  };

  // The hidden file input is shared by every session row; we remember which session
  // triggered it so the upload attaches to the right one.
  const handleUploadClick = (session) => {
    pendingSessionRef.current = session;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    const session = pendingSessionRef.current;
    e.target.value = '';
    if (!file || !session) return;

    setUploadingFor(session._id);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await api.post('/upload', formData);
      const eventId = session.eventId?._id || session.eventId;

      await api.post(`/events/${eventId}/sessions/${session._id}/resources`, {
        title: uploadRes.data.originalName,
        url: uploadRes.data.fileUrl,
        fileType: uploadRes.data.mimeType
      });

      setSessions((prev) =>
        prev.map((s) =>
          s._id === session._id
            ? {
                ...s,
                resources: [
                  ...(s.resources || []),
                  { title: uploadRes.data.originalName, url: uploadRes.data.fileUrl, fileType: uploadRes.data.mimeType }
                ]
              }
            : s
        )
      );
      setStatus({ type: 'success', message: `"${uploadRes.data.originalName}" attached to ${session.title}.` });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.error || 'Upload failed. Please try again.'
      });
    } finally {
      setUploadingFor(null);
      pendingSessionRef.current = null;
    }
  };

  if (loading) {
    return <div className="h-64 rounded-md bg-surface-muted animate-pulse" />;
  }

  if (!activeProfile) {
    return (
      <div className="space-y-8 font-sans">
        <div>
          <Badge variant="gold">SPEAKER PORTAL</Badge>
          <h1 className="font-display text-h2 uppercase text-ink mt-1">Speaker Workstation</h1>
        </div>
        <Card className="p-12 text-center">
          <User className="w-12 h-12 text-ink-muted mx-auto mb-3" />
          <h3 className="text-h3 font-semibold text-ink">No Speaker Profile Linked</h3>
          <p className="text-body-sm text-ink-muted mt-1">
            Your account is not yet linked to a speaker record. An event organizer can add you from the
            event's speaker roster.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      <div>
        <Badge variant="gold">SPEAKER PORTAL</Badge>
        <h1 className="font-display text-h2 uppercase text-ink mt-1">Speaker Workstation</h1>
        <p className="text-body-sm text-ink-muted">Manage your profile bio, assigned sessions, and presentation material</p>
      </div>

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

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
        onChange={handleFileSelected}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Left Profile Bio Card */}
        <Card className="md:col-span-5 p-6 text-center space-y-4">
          <img
            src={activeProfile.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'}
            alt={activeProfile.name}
            className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-accent"
          />
          <div>
            <h2 className="text-h3 font-semibold text-ink">{activeProfile.name}</h2>
            <p className="text-xs font-semibold text-accent">{activeProfile.title}</p>
            <p className="text-body-sm text-ink-muted">{activeProfile.company}</p>
          </div>

          {activeProfile.topicTags?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              {activeProfile.topicTags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] font-semibold bg-surface-muted text-ink-muted px-2.5 py-1 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="text-left pt-3 border-t border-line">
            <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">
              Speaker Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="field h-28"
            />
            <Button
              size="sm"
              variant="primary"
              className="mt-2 w-full"
              onClick={handleSaveProfile}
              disabled={saving || bio === activeProfile.bio}
              icon={Save}
            >
              {saving ? 'Saving...' : 'Save Profile Updates'}
            </Button>
          </div>
        </Card>

        {/* Right Assigned Sessions */}
        <div className="md:col-span-7 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-h3 font-semibold text-ink">Assigned Sessions</h3>
              <Badge variant="accent">{sessions.length} TOTAL</Badge>
            </div>

            {sessions.length === 0 ? (
              <p className="text-body-sm text-ink-muted">You have not been assigned to any sessions yet.</p>
            ) : (
              sessions.map((sess) => (
                <div key={sess._id} className="p-4 rounded-md bg-surface-muted border border-line space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold text-base text-ink">{sess.title}</h4>
                    <Badge variant="accent">{sess.track}</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      {sess.roomName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      {new Date(sess.startTime).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {sess.resources?.length > 0 && (
                    <div className="pt-2 border-t border-line space-y-1">
                      <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                        Attached Material
                      </p>
                      {sess.resources.map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {r.title}
                        </a>
                      ))}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleUploadClick(sess)}
                    disabled={uploadingFor === sess._id}
                    icon={Upload}
                  >
                    {uploadingFor === sess._id ? 'Uploading...' : 'Upload Presentation Material'}
                  </Button>
                </div>
              ))
            )}
          </Card>
        </div>

      </div>
    </div>
  );
};
