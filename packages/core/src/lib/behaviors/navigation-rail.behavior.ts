/** Shared decision for a user request to toggle the rail's extended state. */
export function getNextNavigationRailExtended(isExtended: boolean): boolean {
  return !isExtended;
}

/**
 * Resolves whether a rail item is the selected one. A parent-tracked
 * `selectedItem` index always wins; without one, the item owns its
 * uncontrolled `selected` flag.
 */
export function resolveNavigationRailItemSelection({
  selectedItem,
  index,
  selected,
}: {
  selectedItem: number | null | undefined;
  index: number | undefined;
  selected: boolean;
}): boolean {
  if (selectedItem == null) return selected;
  return index != null && selectedItem === index;
}
