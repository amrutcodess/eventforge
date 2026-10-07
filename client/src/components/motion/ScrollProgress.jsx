import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isPublicRoute } from '../../lib/routes';

/**
 * A 2px accent bar across the top of the viewport showing how far down the page you are.
 *
 * Driven by a raw scroll listener rather than GSAP's ScrollTrigger, and that is the right call
 * here: the bar is `position: fixed`, so it has no position in the document for a trigger to
 * measure against — the honest input is `scrollY / (scrollHeight - innerHeight)`.
 *
 * The work is two assignments to a transform, coalesced into one animation frame. Setting
 * `scaleX` on a compositor-friendly property rather than `width` keeps it off the layout path,
 * which matters because this fires on every scroll tick.
 *
 * Public routes only, for the same reason `SmoothScroll` is: a progress bar over a dashboard
 * table is noise.
 */
export const ScrollProgress = () => {
  const ref = useRef(null);
  const { pathname } = useLocation();
  const visible = isPublicRoute(pathname);

  useEffect(() => {
    if (!visible) return undefined;

    const el = ref.current;
    if (!el) return undefined;

    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      el.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [visible, pathname]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5" aria-hidden="true">
      <div
        ref={ref}
        className="h-full origin-left bg-accent"
        // Starts collapsed. Without this the bar is full-width for the first frame, which
        // reads as a glitch on every page load.
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
};
