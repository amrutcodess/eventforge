// Module-level singleton rather than a React context: `Modal` needs to pause scrolling
// from four levels deep, and threading a provider through every dashboard to reach it
// would be more machinery than the problem deserves.
let instance = null;

export const setLenis = (lenis) => {
  instance = lenis;
};

export const getLenis = () => instance;

// No-ops when Lenis is absent — which is every dashboard, where native scrolling is
// used and `body { overflow: hidden }` still does the locking on its own.
export const pauseScroll = () => instance?.stop();
export const resumeScroll = () => instance?.start();
