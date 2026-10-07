import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registered once, here, so no page can import `gsap` before the plugin exists.
gsap.registerPlugin(ScrollTrigger);

// Lenis scrolls the real document rather than a wrapper element, so ScrollTrigger keeps
// using `window` as its scroller. Setting this explicitly documents that coupling.
ScrollTrigger.defaults({ scroller: window });

export { gsap, ScrollTrigger };
