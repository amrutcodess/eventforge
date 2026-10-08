import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLenis } from '../../lib/lenis';
import { ScrollTrigger } from '../../lib/gsap';

/**
 * Resets scroll on navigation, and honours a `#section` hash when there is one.
 *
 * React Router does not do either on its own: without the reset, clicking through from Landing to
 * an event keeps you scrolled halfway down the new page.
 *
 * The hash branch does not call `scrollIntoView` in the common case, because it would fight Lenis
 * — Lenis owns the scroll position on public routes and a native jump lands somewhere Lenis then
 * corrects on its next frame, which shows as a visible double-move. So the scroll goes through
 * Lenis when it exists, and falls back to a computed offset when it does not (reduced motion, and
 * dashboards, where Lenis is deliberately never mounted).
 *
 * The offset is not a constant here. Lenis reads the target's own `scroll-margin-top`, and the
 * fallback path reads the same value back out of `getComputedStyle`, so the `scroll-mt-*` class on
 * the section is the only place the navbar height is written down. Carrying a second copy of it in
 * this file is how these land 96px out — which is exactly what happened when both were applied.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const id = hash ? hash.slice(1) : null;
    let cancelled = false;
    let timer = null;
    let correction = null;

    const scrollTo = (target, smooth) => {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(target, smooth ? { duration: 0.9 } : { immediate: true });
        return;
      }
      // `window.scrollTo` ignores `scroll-margin-top`, so the same value is subtracted by hand.
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - margin;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'auto' });
    };

    // A wheel or touch means the visitor is driving; stop steering for them.
    let takenOver = false;
    const yieldToUser = () => {
      takenOver = true;
    };
    window.addEventListener('wheel', yieldToUser, { passive: true, once: true });
    window.addEventListener('touchstart', yieldToUser, { passive: true, once: true });

    if (!id) {
      // `immediate` skips Lenis's smoothing — a route change should land, not glide.
      const frame = requestAnimationFrame(() => {
        if (cancelled) return;
        getLenis()?.scrollTo(0, { immediate: true });
        window.scrollTo(0, 0);
        ScrollTrigger.refresh();
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
        window.removeEventListener('wheel', yieldToUser);
        window.removeEventListener('touchstart', yieldToUser);
      };
    }

    // The landing page renders its sections only once its data resolves, so on a cold load of
    // `/#pricing` the anchor does not exist on the first frame — and once it does, the page is
    // still moving underneath it (fonts swapping, stats and event cards dropping in). Scrolling
    // at that instant lands wherever the section happened to be, which is how `/#pricing` ended
    // up 5,500px off. So: wait for the anchor to exist *and* hold still, then scroll.
    const STEP = 120;
    const CAP = 4000;
    let lastOffset = null;
    let stableFor = 0;
    let waited = 0;

    const settle = () => {
      if (cancelled) return;

      const target = document.getElementById(id);
      const offset = target
        ? Math.round(target.getBoundingClientRect().top + window.scrollY)
        : null;

      stableFor = target && offset === lastOffset ? stableFor + 1 : 0;
      lastOffset = offset;

      if (target && (stableFor >= 2 || waited >= CAP)) {
        scrollTo(target, true);
        ScrollTrigger.refresh();

        // Images below the fold load lazily, so content can still grow while the smooth scroll
        // travels past it. One re-anchor after the ride, and only if the visitor has not taken
        // over the scroll themselves.
        correction = setTimeout(() => {
          if (cancelled || takenOver) return;
          const el = document.getElementById(id);
          if (!el) return;
          const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
          const drift = Math.round(el.getBoundingClientRect().top - margin);
          if (Math.abs(drift) > 4) {
            scrollTo(el, true);
            ScrollTrigger.refresh();
          }
        }, 1400);
        return;
      }

      if (waited >= CAP) return;
      waited += STEP;
      timer = setTimeout(settle, STEP);
    };

    timer = setTimeout(settle, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(correction);
      window.removeEventListener('wheel', yieldToUser);
      window.removeEventListener('touchstart', yieldToUser);
    };
  }, [pathname, hash]);

  return null;
};
