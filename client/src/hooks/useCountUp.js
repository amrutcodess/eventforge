import { useEffect, useState } from 'react';
import { gsap } from '../lib/gsap';

/**
 * Tweens a number from its previous value to `value` on mount/change. Returns the
 * in-flight value; formatting is left to the caller.
 *
 * `enabled: false` holds the readout at 0 until the caller flips it on — that is how a
 * below-the-fold stat waits for its scroll trigger instead of having already finished counting
 * by the time it is scrolled to. The default is `true`, so every existing call site
 * (`useCountUp(users.length)`) behaves exactly as before.
 *
 * Reduced motion returns the final value immediately — a stat that animates is a
 * flourish, but a stat showing the wrong number is a bug. That check is made *before* the
 * `enabled` one, so a reduced-motion user never sees a stat parked at 0 waiting on a scroll
 * trigger that would not animate it anyway.
 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useCountUp = (value, { duration = 0.8, enabled = true } = {}) => {
  const target = Number(value) || 0;
  // An immediate count starts at its target, so the number is never briefly 0 on first paint;
  // a deferred one starts at 0, so the count-up is visible when it does begin.
  const [display, setDisplay] = useState(prefersReducedMotion() || enabled ? target : 0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(target);
      return;
    }

    if (!enabled) {
      setDisplay(0);
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
  }, [target, duration, enabled]);

  return display;
};
