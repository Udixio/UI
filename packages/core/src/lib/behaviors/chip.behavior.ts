/** Shared decision for a user request to toggle a chip. */
export function getChipSelectionTransition({ disabled, selected }: { disabled: boolean; selected: boolean }): { blocked: boolean; nextSelected?: boolean } {
  return disabled ? { blocked: true } : { blocked: false, nextSelected: !selected };
}
