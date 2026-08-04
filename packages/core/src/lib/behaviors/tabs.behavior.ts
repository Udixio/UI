/** Resolves whether a tab is the selected one from the parent-tracked index. */
export function resolveTabSelection({
  selectedTab,
  index,
}: {
  selectedTab: number | null | undefined;
  index: number | undefined;
}): boolean {
  return selectedTab != null && index != null && selectedTab === index;
}

export type TabListNavigationKey = 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

/**
 * Shared roving-tabindex decision for a `tablist`: given the key pressed and
 * which tabs are disabled, returns the index that should receive focus and
 * selection next. Wraps around the enabled tabs and skips disabled ones.
 * Returns `currentIndex` unchanged when every tab is disabled.
 */
export function getNextTabIndex({
  key,
  currentIndex,
  disabled,
}: {
  key: TabListNavigationKey;
  currentIndex: number;
  disabled: boolean[];
}): number {
  const count = disabled.length;
  if (count === 0) return currentIndex;

  const isEnabled = (index: number) => !disabled[index];

  const step = (from: number, delta: number): number => {
    let next = from;
    for (let i = 0; i < count; i++) {
      next = (next + delta + count) % count;
      if (isEnabled(next)) return next;
    }
    return currentIndex;
  };

  switch (key) {
    case 'ArrowRight':
      return step(currentIndex, 1);
    case 'ArrowLeft':
      return step(currentIndex, -1);
    case 'Home':
      return isEnabled(0) ? 0 : step(-1, 1);
    case 'End':
      return isEnabled(count - 1) ? count - 1 : step(count, -1);
  }
}
