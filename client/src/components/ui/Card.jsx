import React from 'react';

export const Card = ({
  children,
  className = '',
  dark = false,
  hover = true
}) => {
  return (
    <div
      className={`rounded-3xl p-6 transition-all duration-300 ${
        dark
          ? 'bg-forge-darkCard text-white border border-forge-darkBorder shadow-xl'
          : 'bg-white text-slate-900 border border-slate-100 shadow-forge-card'
      } ${hover ? 'hover:-translate-y-1 hover:shadow-forge-soft' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
