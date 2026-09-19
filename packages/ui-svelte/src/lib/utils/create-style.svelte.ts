/**
 * Svelte primitive: wraps a pure @udixio/core style function in a `$derived`,
 * which memoizes on the runes read by `state` -- the counterpart of Angular's
 * `computed`-based createStyle and React's createUseStyle.
 */
export function createStyle<S>(
  styleFn: (state: S) => Record<string, string>,
  state: () => S,
): { readonly current: Record<string, string> } {
  const current = $derived.by(() => styleFn(state()));
  return {
    get current() {
      return current;
    },
  };
}
