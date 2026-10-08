/**
 * Which routes get the public-site treatment.
 *
 * This lived inside `SmoothScroll` and would have been copy-pasted into `ScrollProgress` and
 * `PageTransition` — three lists that must agree, in three files, with nothing to catch them
 * drifting apart. The symptom of drift here is subtle rather than loud (smooth scrolling on a
 * dashboard, or a progress bar that never fills), which is exactly the kind of bug that
 * survives review. One list, imported.
 *
 * Dashboards are deliberately absent: they hold long data tables where hijacked scrolling is a
 * usability cost, not a flourish.
 */
export const PUBLIC_ROUTES = [
  /^\/$/,
  /^\/events\//,
  /^\/ticket-pass\//,
  /^\/login$/,
  /^\/register$/,
  /^\/legal$/
];

export const isPublicRoute = (pathname = '') => PUBLIC_ROUTES.some((route) => route.test(pathname));
