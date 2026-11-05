/** Internal, live policy reader for eventual composition into the complete runtime.
 * `reduce` opts in; `auto`, missing or unrecognised values follow the system.
 * No observers are retained. SSR defaults to the non-reduced presentation. */
export function createMotionPolicy(): { readonly reduced: boolean } {
  return {
    get reduced() {
      if (typeof document === 'undefined') return false;
      if (document.documentElement?.getAttribute('data-motion-policy') === 'reduce') return true;
      return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;
    },
  };
}
