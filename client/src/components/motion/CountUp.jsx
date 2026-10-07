import React, { useEffect, useRef, useState } from 'react';
import { useCountUp } from '../../hooks/useCountUp';

/**
 * A number that counts up when it is scrolled into view.
 *
 * `useCountUp` on its own tweens on mount, which is right for an above-the-fold dashboard metric
 * and wrong for a stat two screens down: by the time the reader arrives the count is over and
 * they have seen nothing but the final number. This component supplies the missing trigger.
 *
 * An `IntersectionObserver` rather than GSAP's `ScrollTrigger` because it is the platform
 * primitive for exactly this question, needs no cleanup beyond `disconnect()`, and — unlike a
 * scroll listener — fires immediately for an element that is already on screen, so an
 * above-the-fold stat still counts.
 *
 * If `IntersectionObserver` is unavailable the count simply runs immediately. A missing observer
 * must never leave a real number stuck at zero.
 */
export const CountUp = ({
  value,
  className = '',
  duration = 1.1,
  decimals = 0,
  prefix = '',
  suffix = '',
}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const display = useCountUp(value, { duration, enabled: inView });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        // One-shot: a stat that re-counts every time it scrolls past draws attention to the
        // motion instead of the number.
        observer.disconnect();
      },
      // A tenth of the way up the viewport, so the count starts as the stat is arriving rather
      // than after it has fully landed.
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const shown = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
};

export default CountUp;
