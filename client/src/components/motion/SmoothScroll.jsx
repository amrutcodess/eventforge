import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { setLenis } from '../../lib/lenis';
import { isPublicRoute } from '../../lib/routes';

export const SmoothScroll = () => {
  const { pathname } = useLocation();
  const isPublic = isPublicRoute(pathname);

  // Keyed on the boolean, not on `pathname`: public → public navigation must NOT tear
  // down and rebuild Lenis, which would reset scroll position mid-journey.
  useEffect(() => {
    if (!isPublic) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
    });
    setLenis(lenis);

    lenis.on('scroll', ScrollTrigger.update);

    // Driven from gsap.ticker rather than a second requestAnimationFrame loop, so
    // Lenis and ScrollTrigger advance on one clock.
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Bebas Neue's metrics differ sharply from Inter's, so heading heights change when
    // the fonts swap in — re-measure once they have.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
      ScrollTrigger.refresh();
    };
  }, [isPublic]);

  return null;
};
