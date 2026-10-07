import React from 'react';

const RADII = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg'
};

/**
 * `radius` is an explicit prop rather than something callers override with a
 * `className`, because two conflicting rounded-* utilities resolve by stylesheet order,
 * not by the order they appear in the class attribute.
 *
 * Separation comes from a hairline and a background change; there is no lift and no glow.
 */
export const Card = ({
  children,
  className = '',
  dark = false,
  hover = true,
  radius = 'md',
  padded = true
}) => {
  const themeStyles = dark
    ? 'bg-night-raised text-white border border-night-line'
    : 'bg-surface text-ink border border-line';

  const hoverStyles = hover ? 'transition-colors hover:border-line-strong' : '';

  return (
    <div
      className={`${RADII[radius] || RADII.md} ${padded ? 'p-6' : ''} ${themeStyles} ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
};
