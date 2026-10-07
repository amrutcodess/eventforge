import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Sparkles, Copy, Check, Wand2 } from 'lucide-react';
import api from '../utils/api';

export const AIModal = ({ isOpen, onClose, onInsertDraft, initialType = 'event_description' }) => {
  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setGeneratedDraft('');

    try {
      const res = await api.post('/ai/draft-content', {
        type,
        title: title.trim(),
        keywords: keywords.trim()
      });
      setGeneratedDraft(res.data.draft);
    } catch (err) {
      console.error('AI Draft generation failed:', err);
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
      subtitle="Server-side AI copywriting powered by OpenAI API"
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
              className={`px-3 py-2 text-xs font-semibold rounded-sm border transition-colors ${
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
          {loading ? 'AI Drafting Content...' : 'Generate Copy Draft'}
        </Button>

        {generatedDraft && (
          <div className="mt-4 p-5 rounded-md bg-canvas border border-line space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-accent">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Generated Draft</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 text-xs font-medium bg-surface border border-line rounded-sm text-ink hover:bg-surface-muted flex items-center gap-1"
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
                    className="px-3 py-1 text-xs font-semibold bg-accent text-white rounded-sm hover:bg-accent-hover"
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
