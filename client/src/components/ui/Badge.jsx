import React from 'react';

/**
 * Badges are for STATUS, not decoration. Section headers use the `.eyebrow` class
 * instead — using a badge as a section header was the visible symptom of the old drift.
 *
 * The shell is square with uppercase micro-type, matching the reference. `gold` is kept
 * as a variant name for call-site compatibility but maps onto the single accent.
 */
export const Badge = ({
  children,
  variant = 'accent',
  dot = false,
  className = ''
}) => {
  const variants = {
    accent: 'bg-accent/10 text-accent border-accent/30',
    gold: 'bg-accent/10 text-accent border-accent/30',
    success: 'bg-success-soft text-success border-success/30',
    warning: 'bg-warning-soft text-warning border-warning/30',
    danger: 'bg-danger-soft text-danger border-danger/30',
    info: 'bg-info-soft text-info border-info/30',
    neutral: 'bg-canvas text-ink-muted border-line',
    dark: 'bg-white/10 text-white border-white/20'
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-none border px-2.5 py-1 text-eyebrow uppercase font-medium ${
        variants[variant] || variants.accent
      } ${className}`}
    >
      {/* `bg-current`, and no pulse — the permanently pulsing dot was an AI tell. */}
      {dot && <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-current" />}
      <span>{children}</span>
    </span>
  );
};
