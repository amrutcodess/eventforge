import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { pauseScroll, resumeScroll } from '../../lib/lenis';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl'
}) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      // Lenis ignores `body { overflow }`, so the page would keep scrolling behind the
      // modal without this. pauseScroll() is a no-op on dashboards, where Lenis is null
      // and the overflow lock is what does the work.
      pauseScroll();
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      resumeScroll();
      // Restore to '' rather than 'auto' — 'auto' overrides any stylesheet default.
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 animate-fade-in">
      <div
        className={`relative w-full ${maxWidth} flex max-h-[90vh] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-menu`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-canvas px-6 py-5">
          <div>
            <h3 className="text-h3 font-semibold tracking-tight text-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
