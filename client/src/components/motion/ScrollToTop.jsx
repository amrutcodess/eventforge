import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLenis } from '../../lib/lenis';
import { ScrollTrigger } from '../../lib/gsap';

/**
 * Resets scroll on navigation. React Router does not do this on its own, so without it
 * clicking through from Landing to an event keeps you scrolled halfway down the new page.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // `immediate` skips Lenis's smoothing — a route change should land, not glide.
    getLenis()?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);

    // The new route's content has mounted by the next frame; re-measure trigger positions.
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
};
