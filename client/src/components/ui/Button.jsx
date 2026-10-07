import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Square by design. The 0 border-radius is the single most identity-defining rule in
 * the restyle — `rounded-full` never appears on a CTA.
 *
 * Variant names are preserved from the previous design so call sites keep working, but
 * `secondary` and `ghost` are now defined for LIGHT surfaces. Previously they were
 * `bg-white/10 text-white` / `text-slate-300`, which rendered white-on-white where they
 * were used on light cards; `inverse` covers the on-dark case that `secondary` used to
 * be reached for.
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon = ArrowRight,
  showIcon = true,
  caps = false,
  onClick,
  disabled = false,
  type = 'button',
  className = ''
}) => {
  const baseStyles =
    'group relative overflow-hidden inline-flex items-center justify-center rounded-none font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer ' +
    // `grayscale` alongside the opacity: fading crimson to 50% over a white card produces a
    // pink that is not in the palette and reads as broken rather than disabled. Desaturating
    // first keeps a disabled primary neutral. It is a no-op on the already-neutral
    // `dark`/`inverse`/`ghost` variants, which sit on dark surfaces.
    'disabled:opacity-50 disabled:grayscale';

  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'border border-line-strong text-ink hover:border-ink',
    dark: 'bg-night-raised text-white border border-night-line hover:bg-night-line',
    outline: 'border border-accent text-accent hover:bg-accent hover:text-white',
    inverse: 'border border-white/40 text-white hover:bg-white hover:text-ink',
    ghost: 'text-ink-muted hover:text-ink hover:bg-surface-muted'
  };

  const boxes = {
    sm: 'h-10 px-6 gap-2',
    md: 'h-12 px-8 gap-2.5',
    lg: 'h-14 px-10 gap-3'
  };

  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${boxes[size]} ${
        caps ? 'text-caps-btn uppercase' : sizes[size]
      } ${className}`}
    >
      {/* Background sweep on the filled variant only. On `primary` the button's own colour
          change is subtle enough that a wipe reads as an addition; on the outlined variants
          there is nothing to wipe. `pointer-events-none` so it can never swallow the click,
          and it sits below the label in the stacking order. */}
      {variant === 'primary' && !disabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 ease-out group-hover:translate-x-0 motion-reduce:hidden"
        />
      )}
      <span className="relative z-10">{children}</span>
      {showIcon && Icon && (
        // Bare icon that nudges diagonally on hover. The previous circular icon chip was
        // deleted; its `group-hover:` reference had no `group` parent, so it never fired.
        <Icon className="relative z-10 w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
    </button>
  );
};
