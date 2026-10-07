import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';

/**
 * Declarative fade-up on first entry.
 *
 * The animation is `gsap.from()`, never an `opacity-0` class in markup — that way
 * reduced-motion users are never shown a hidden element, because the hidden state only
 * ever exists inside the tween.
 */
export const Reveal = ({
  children,
  className = '',
  y = 20,
  delay = 0,
  duration = 0.6,
  as: Tag = 'div',
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(el, {
        opacity: 0,
        y,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    // matchMedia().revert() kills the tween AND its ScrollTrigger on unmount. Without
    // it, triggers outlive the node and fire against detached elements.
    return () => mm.revert();
  }, [y, delay, duration]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
};
