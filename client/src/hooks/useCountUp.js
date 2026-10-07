import { useEffect, useState } from 'react';
import { gsap } from '../lib/gsap';

/**
 * Tweens a number from its previous value to `value` on mount/change. Returns the
 * in-flight value; formatting is left to the caller.
 *
 * Reduced motion returns the final value immediately — a stat that animates is a
 * flourish, but a stat showing the wrong number is a bug.
 */
export const useCountUp = (value, { duration = 0.8 } = {}) => {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target);
      return;
    }

    const proxy = { v: 0 };
    const tween = gsap.to(proxy, {
      v: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => setDisplay(proxy.v),
      onComplete: () => setDisplay(target),
    });

    return () => tween.kill();
  }, [target, duration]);

  return display;
};
