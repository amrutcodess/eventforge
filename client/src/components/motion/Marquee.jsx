import React from 'react';

/**
 * A continuously scrolling row of wordmarks.
 *
 * The track is duplicated and translated by exactly -50%, so the loop is seamless: at the
 * moment the first copy has fully left, the second is sitting precisely where the first
 * started. That only works if both copies are identical and the container is `w-max`, which is
 * why the duplication is inside the component rather than left to the caller.
 *
 * Three behaviours worth stating:
 *   - The second copy is `aria-hidden`. Without it a screen reader reads every name twice.
 *   - It pauses on hover, so a visitor can actually read a name they recognised.
 *   - Under `prefers-reduced-motion` the animation is removed entirely. A marquee is the single
 *     most common motion-sensitivity trigger there is, and a static row of logos is a perfectly
 *     good fallback — hence `motion-reduce:animate-none` rather than a slower animation.
 */
export const Marquee = ({ items, speed = 42, className = '', itemClassName = '' }) => {
  if (!items?.length) return null;

  const track = (
    <div className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <div key={i} className={`shrink-0 px-8 md:px-12 ${itemClassName}`}>
          {item}
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`group relative overflow-hidden ${className}`}
      style={{
        // A soft edge rather than a hard clip — logos appearing and vanishing at a razor line
        // is the detail that makes a marquee look cheap.
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)'
      }}
    >
      <div
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animationDuration: `${speed}s` }}
      >
        {track}
        <div aria-hidden="true" className="flex shrink-0 items-center">
          {items.map((item, i) => (
            <div key={i} className={`shrink-0 px-8 md:px-12 ${itemClassName}`}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
