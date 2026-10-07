import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';

/**
 * Declarative fade-up on first entry.
 *
 * The animation is `gsap.from()`, never an `opacity-0` class in markup — that way
 * reduced-motion users are never shown a hidden element, because the hidden state only
 * ever exists inside the tween.
 *
 * `variant` and `stagger` were added later without changing anything above them, so every
 * existing call site (`<Reveal>`, `<Reveal delay={0.1}>`, `<Reveal className="...">`) behaves
 * exactly as it did.
 */

/** Direction is where the element travels *from*. */
const VARIANTS = {
  fade: (y) => ({ opacity: 0 }),
  up: (y) => ({ opacity: 0, y }),
  left: (y) => ({ opacity: 0, x: -y }),
  right: (y) => ({ opacity: 0, x: y }),
  scale: () => ({ opacity: 0, scale: 0.96 })
};

export const Reveal = ({
  children,
  className = '',
  y = 20,
  delay = 0,
  duration = 0.6,
  variant = 'up',
  /**
   * When set, the element's direct children animate in sequence instead of the element as a
   * whole. `true` uses a 0.06s offset; a number sets it. The parent itself is not animated in
   * that case — a parent that fades while its children slide reads as two competing motions.
   */
  stagger = false,
  as: Tag = 'div',
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from = (VARIANTS[variant] || VARIANTS.up)(y);
    const targets = stagger ? el.children : el;
    if (stagger && !el.children.length) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(targets, {
        ...from,
        duration,
        delay,
        ease: 'power3.out',
        stagger: stagger === true ? 0.06 : stagger,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    // matchMedia().revert() kills the tween AND its ScrollTrigger on unmount. Without
    // it, triggers outlive the node and fire against detached elements.
    return () => mm.revert();
  }, [y, delay, duration, variant, stagger]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
};
