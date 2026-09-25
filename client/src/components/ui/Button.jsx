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
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-forge-accent text-white hover:bg-forge-accentHover shadow-forge-soft hover:shadow-forge-glow",
    secondary: "bg-forge-warmGrey text-slate-900 hover:bg-slate-200 border border-slate-200",
    dark: "bg-forge-darkCard text-white hover:bg-slate-800 border border-forge-darkBorder",
    outline: "border-2 border-forge-accent text-forge-accent hover:bg-forge-accentLight",
    ghost: "text-slate-700 hover:bg-slate-100"
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs gap-2",
    md: "px-5 py-2.5 text-sm gap-2.5",
    lg: "px-7 py-3.5 text-base gap-3 font-semibold"
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
        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center -mr-1 transition-transform group-hover:translate-x-0.5">
          <Icon className="w-3.5 h-3.5" />
        </span>
      )}
    </button>
  );
};
