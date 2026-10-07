import React from 'react';
import { ArrowRight } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon = ArrowRight,
  showIcon = true,
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none tracking-wide cursor-pointer";

  const variants = {
    primary: "bg-forge-accent text-white hover:bg-forge-accentGlow shadow-forge-glow border border-forge-accentGlow/40 hover:border-emerald-400/50",
    secondary: "bg-white/10 text-white hover:bg-white/20 border border-white/15 backdrop-blur-md",
    dark: "bg-forge-darkCard text-white hover:bg-slate-800 border border-forge-darkBorder",
    outline: "border border-forge-accent text-emerald-300 hover:bg-forge-accentLight hover:border-emerald-400",
    ghost: "text-slate-300 hover:bg-white/5 hover:text-white"
  };

  const sizes = {
    sm: "px-4 py-2 text-xs gap-2",
    md: "px-6 py-3 text-sm gap-2.5",
    lg: "px-8 py-4 text-base gap-3 font-bold"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      <span>{children}</span>
      {showIcon && Icon && (
        <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center -mr-1 transition-transform group-hover:translate-x-1">
          <Icon className="w-3.5 h-3.5 text-white" />
        </span>
      )}
    </button>
  );
};
