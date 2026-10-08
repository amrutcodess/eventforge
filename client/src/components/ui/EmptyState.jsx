import React from 'react';

/**
 * The panel that stands in for a list with nothing in it.
 *
 * It exists because every empty list in this app was previously a bare `<p>` dropped inside a
 * responsive grid — so "No sessions published yet." rendered as a single narrow column of a
 * three-column grid with the other two thirds empty, which reads as a layout bug rather than an
 * empty state. `col-span-full` and a dashed outline fix that, and the title/body split gives the
 * reader something to do instead of just telling them nothing is here.
 *
 * The dashed border is deliberate and is the one dashed line in the system: it is an affordance
 * for "this slot is unfilled", not a divider, and no content card uses it.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  body,
  action,
  dark = false,
  className = ''
}) => (
  <div
    className={`col-span-full flex flex-col items-center justify-center border border-dashed px-8 py-14 text-center ${
      dark ? 'border-night-line' : 'border-line-strong'
    } ${className}`}
  >
    {Icon && <Icon className="h-6 w-6 text-accent" aria-hidden="true" />}
    <p className={`mt-5 text-base font-semibold ${dark ? 'text-white' : 'text-ink'}`}>{title}</p>
    {body && (
      <p className={`mt-2 max-w-md text-body-sm ${dark ? 'text-white/50' : 'text-ink-muted'}`}>
        {body}
      </p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default EmptyState;
