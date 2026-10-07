import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Sparkles, Copy, Check, Wand2, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export const AIModal = ({
  isOpen,
  onClose,
  onInsertDraft,
  initialType = 'event_description',
  // When the dashboard has an event selected, pass it: the server grounds the copy in that
  // event's real venue, dates, tracks and speakers instead of composing from the title alone.
  // The old version accepted a `context` argument on the server that no caller ever sent, so
  // every draft was written from three words of input.
  eventId = null,
  eventTitle = null
}) => {
  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [draftSource, setDraftSource] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setGeneratedDraft('');
    setError(null);

    try {
      const res = await api.post('/ai/draft-content', {
        type,
        title: title.trim(),
        keywords: keywords.trim(),
        eventId: eventId || undefined
      });
      setGeneratedDraft(res.data.draft);
      setDraftSource(res.data.source);
    } catch (err) {
      // Previously this only reached the console, so a failure looked identical to a slow
      // request that never finished.
      setError(
        err?.response?.data?.error ||
          'Could not generate a draft. Check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Event Content Draft Generator"
      subtitle={
        eventTitle
          ? `Grounded in the live records for ${eventTitle}`
          : 'Grounded in your event records, not the model’s memory'
      }
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'event_description', label: 'Event Landing' },
            { id: 'speaker_bio', label: 'Speaker Bio' },
            { id: 'session_summary', label: 'Session Summary' },
            { id: 'announcement', label: 'Announcement' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-none border transition-colors ${
                type === t.id
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface-muted text-ink-muted border-line hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Title / Topic Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next-Gen Generative UI & Agentic Workflows"
              className="field"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Keywords / Key Highlights (Optional)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. 3D WebGL, server-side loops, reactive state, enterprise scalability"
              className="field"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !title.trim()}
          variant="primary"
          className="w-full"
          icon={Wand2}
        >
          {loading ? 'Drafting Content...' : 'Generate Copy Draft'}
        </Button>

        {error && (
          <div className="flex items-start gap-2 border border-danger/30 bg-danger-soft px-4 py-3 text-xs text-danger">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {generatedDraft && (
          <div className="mt-4 p-5 rounded-md bg-canvas border border-line space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-accent">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Generated Draft</span>
                {/* Provenance, stated rather than implied. The deployment may have no model
                    configured, in which case the server composes the copy from real records —
                    still useful, but the user should know which one they are reading. */}
                <span className="font-normal text-ink-muted">
                  {draftSource === 'llm' ? '· written by AI' : '· composed from event data'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 text-xs font-medium bg-surface border border-line rounded-none text-ink hover:bg-surface-muted flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                {onInsertDraft && (
                  <button
                    onClick={() => {
                      onInsertDraft(generatedDraft);
                      onClose();
                    }}
                    className="px-3 py-1 text-xs font-semibold bg-accent text-white rounded-none hover:bg-accent-hover"
                  >
                    Insert Draft
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-ink leading-relaxed font-sans whitespace-pre-line bg-surface p-4 rounded-md border border-line">
              {generatedDraft}
            </p>
          </div>
        )}

      </div>
    </Modal>
  );
};
