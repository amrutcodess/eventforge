import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from '../../lib/gsap';

/**
 * A short fade on route change.
 *
 * Keyed on `pathname`, so it re-runs on navigation and not on every render. `gsap.from()` with
 * no `opacity-0` class means the page is never hidden by markup: if the tween never runs —
 * reduced motion, an error, JS not yet hydrated — the content is simply visible.
 *
 * The fade is deliberately short (0.28s) and opacity-only. A slide or a longer duration makes
 * navigation feel slower than it is, which is the opposite of what a transition is for.
 */
export const PageTransition = ({ children }) => {
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(el, { opacity: 0, duration: 0.28, ease: 'power2.out' });
    });

    return () => mm.revert();
  }, [pathname]);

  return (
    // `key` forces a fresh element per route, which is what makes the from-tween re-run rather
    // than animate a node that React has already reused.
    <div ref={ref} key={pathname}>
      {children}
    </div>
  );
};
