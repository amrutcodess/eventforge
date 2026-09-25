import React from 'react';

export const Badge = ({
  children,
  variant = 'success',
  dot = true,
  className = ''
}) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dot-emerald-500',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60 dot-amber-500',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/60 dot-rose-500',
    info: 'bg-sky-50 text-sky-700 border-sky-200/60 dot-sky-500',
    accent: 'bg-forge-accentLight text-forge-accent border-forge-accent/20 dot-forge-accent',
    dark: 'bg-slate-800 text-slate-200 border-slate-700 dot-emerald-400'
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    accent: 'bg-forge-accent',
    dark: 'bg-emerald-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${variants[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-slate-400'} animate-pulse`} />}
      <span>{children}</span>
    </span>
  );
};
