import React from 'react';

export const Card = ({
  children,
  className = '',
  dark = false,
  hover = true
}) => {
  const themeStyles = dark
    ? 'bg-forge-darkCard/90 text-white border border-forge-darkBorder backdrop-blur-xl shadow-glass-card'
    : 'bg-white/95 text-slate-900 border border-slate-200 shadow-forge-card';

  const hoverStyles = hover
    ? dark
      ? 'hover:-translate-y-1.5 hover:border-forge-accent/50 hover:shadow-forge-glow'
      : 'hover:-translate-y-1.5 hover:border-forge-accent/40 hover:shadow-forge-soft'
    : '';

  return (
    <div
      className={`rounded-3xl p-6 transition-all duration-400 ${themeStyles} ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
};
