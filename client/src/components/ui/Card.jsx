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
 *
 * `interactive` opts a card into the hover affordance used by event cards: the border takes the
 * accent and any image inside scales up slightly. It is opt-in rather than the default because
 * a stat card or a form panel that reacts to the cursor promises a click that is not there.
 * The image rule uses an arbitrary descendant variant so callers do not each have to remember
 * the transition classes — pass `interactive` and a plain `<img>` inside behaves correctly.
 */
export const Card = ({
  children,
  className = '',
  dark = false,
  hover = true,
  interactive = false,
  radius = 'md',
  padded = true
}) => {
  const themeStyles = dark
    ? 'bg-night-raised text-white border border-night-line'
    : 'bg-surface text-ink border border-line';

  const hoverStyles = hover ? 'transition-colors hover:border-line-strong' : '';

  const interactiveStyles = interactive
    ? 'group overflow-hidden transition-colors hover:border-accent ' +
      '[&_img]:transition-transform [&_img]:duration-[600ms] group-hover:[&_img]:scale-[1.04] ' +
      'motion-reduce:[&_img]:transition-none motion-reduce:group-hover:[&_img]:scale-100'
    : '';

  return (
    <div
      className={`${RADII[radius] || RADII.md} ${padded ? 'p-6' : ''} ${themeStyles} ${hoverStyles} ${interactiveStyles} ${className}`}
    >
      {children}
    </div>
  );
};
