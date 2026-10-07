import React, { useId, useState } from 'react';
import { Plus } from 'lucide-react';

/**
 * A single-open disclosure list.
 *
 * The open/close is animated with `grid-template-rows: 0fr → 1fr`, not with a max-height
 * guess or a measured pixel height. A measured height has to be re-measured on resize and on
 * reflow, and a `max-height: 500px` either clips a long answer or makes a short one open at a
 * visibly wrong speed. The `0fr → 1fr` track animates to exactly the content's height, whatever
 * that is.
 *
 * The panel stays mounted while closed — that is what makes the transition possible — so a closed
 * answer is hidden from assistive tech with `aria-hidden` rather than `display: none`. That is
 * only correct because no answer here contains a focusable element: `aria-hidden` removes a
 * subtree from the accessibility tree but does not stop Tab from reaching a link inside it. If an
 * answer ever gains a link, this needs `inert` instead.
 */
export const Accordion = ({ items = [], className = '' }) => {
  // `-1` rather than `null` so the comparison below is a plain number comparison and the first
  // item can be opened by index without a special case.
  const [openIndex, setOpenIndex] = useState(0);
  const baseId = useId();

  if (!items.length) return null;

  return (
    <div className={`border-y border-line divide-y divide-line ${className}`}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;

        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                className="group flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-accent"
              >
                <span className="text-lg font-semibold tracking-tight">{item.question}</span>
                {/* A plus that becomes a cross. One icon rotated 45° rather than swapping two
                    icons, so the rotation is the transition and nothing re-mounts. */}
                <Plus
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 text-accent transition-transform duration-300 motion-reduce:transition-none ${
                    isOpen ? 'rotate-45' : 'rotate-0'
                  }`}
                />
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!isOpen}
              className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="max-w-prose pb-6 pr-12 text-body-sm text-ink-muted">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
