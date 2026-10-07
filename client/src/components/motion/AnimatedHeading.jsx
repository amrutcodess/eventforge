import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/gsap';

/**
 * The "animate the text" heading: each word rises out of an overflow-hidden mask.
 *
 * Accessibility is the whole difficulty here, and it is not optional. A split heading is a
 * pile of `<span>`s, which a screen reader reads as a list of disconnected words — "Global",
 * "AI", "&", "Cloud" — with no sentence around them. So the visual tree is wrapped in
 * `aria-hidden="true"` and the heading itself carries an `aria-label` with the full string.
 * The reader hears one clean phrase; the eye sees the motion.
 *
 * Two deliberate limits:
 *   - It animates a string, and falls back to plain rendering for anything else. Splitting
 *     arbitrary JSX (a heading containing a `<br />` or an inline link) would either mangle it
 *     or need an HTML parser, and neither is worth it for a heading.
 *   - The words start at their natural position and are moved by the tween, so with reduced
 *     motion — or before the tween runs — the heading is simply a heading. Nothing is hidden
 *     behind a class.
 */
export const AnimatedHeading = ({
  children,
  className = '',
  as: Tag = 'h2',
  delay = 0,
  stagger = 0.055,
  duration = 0.85,
  start = 'top 85%'
}) => {
  const ref = useRef(null);
  const isText = typeof children === 'string';

  useEffect(() => {
    const el = ref.current;
    if (!el || !isText) return;

    const words = el.querySelectorAll('[data-anim-word]');
    if (!words.length) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(words, {
        yPercent: 110,
        duration,
        delay,
        ease: 'power3.out',
        stagger,
        scrollTrigger: { trigger: el, start, once: true }
      });
    });

    return () => mm.revert();
  }, [children, isText, delay, stagger, duration, start]);

  if (!isText) {
    return <Tag className={className}>{children}</Tag>;
  }

  const words = children.split(/(\s+)/).filter((w) => w.length > 0);

  return (
    <Tag ref={ref} className={className} aria-label={children}>
      {/* `aria-hidden` because the aria-label above already carries the sentence. */}
      <span aria-hidden="true">
        {words.map((word, i) =>
          /^\s+$/.test(word) ? (
            // Preserve the original spacing as a real text node rather than a margin, so
            // wrapping and `text-align` behave exactly as they would on plain text.
            <span key={i}>{word}</span>
          ) : (
            // The outer span clips; the inner one moves. `align-bottom` keeps the clip box on
            // the text baseline instead of adding the descender gap that `inline-block` brings.
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <span data-anim-word className="inline-block will-change-transform">
                {word}
              </span>
            </span>
          )
        )}
      </span>
    </Tag>
  );
};
