import React from 'react';

export const Badge = ({
  children,
  variant = 'accent',
  dot = true,
  className = ''
}) => {
  const variants = {
    accent: 'bg-forge-accent/30 text-emerald-300 border-forge-accent/60',
    gold: 'bg-forge-gold/20 text-amber-300 border-forge-gold/40',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    danger: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    info: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    dark: 'bg-white/10 text-slate-300 border-white/15'
  };

  const dotColors = {
    accent: 'bg-emerald-400',
    gold: 'bg-amber-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-sky-400',
    dark: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full border backdrop-blur-md ${variants[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`} />}
      <span>{children}</span>
    </span>
  );
};
