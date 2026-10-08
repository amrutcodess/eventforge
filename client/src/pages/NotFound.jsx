import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Compass } from 'lucide-react';

/**
 * The catch-all route.
 *
 * There was none, so a mistyped URL rendered the navbar and footer around an empty `<div>` —
 * which looks like the app broke rather than like the page does not exist. It sends the visitor
 * somewhere real instead of apologising at them.
 */
export const NotFound = () => (
  <div className="flex min-h-[70vh] items-center bg-canvas text-ink">
    <div className="gutter">
      <p className="eyebrow text-accent">
        <span className="mr-2 opacity-60">—</span>
        Error 404
      </p>

      <h1 className="mt-6 font-display text-display uppercase tracking-tight text-ink">
        Nothing scheduled here
      </h1>

      <p className="mt-6 max-w-prose text-body-lg text-ink-muted">
        That page does not exist. It may have been renamed, or the link that brought you here may
        be out of date.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link to="/">
          <Button variant="primary" size="lg" icon={Compass}>
            Back to the platform
          </Button>
        </Link>
        <Link to="/#featured-events">
          <Button variant="secondary" size="lg">
            Browse live summits
          </Button>
        </Link>
      </div>
    </div>
  </div>
);

export default NotFound;
