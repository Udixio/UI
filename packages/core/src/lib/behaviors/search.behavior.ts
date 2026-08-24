/** A pure accepted/rejected expanded-state transition. */
export type SearchExpansionTransition =
  | { blocked: true; nextExpanded?: never }
  | { blocked: false; nextExpanded: boolean };

/** Resolves a request to expand or collapse Search. */
export function getSearchExpansionTransition({
  disabled,
  isExpanded,
  nextExpanded,
}: {
  disabled: boolean;
  isExpanded: boolean;
  nextExpanded: boolean;
}): SearchExpansionTransition {
  if (disabled || isExpanded === nextExpanded) return { blocked: true };
  return { blocked: false, nextExpanded };
}

export type SearchKeyboardTransition = {
  blocked: boolean;
  nextExpanded?: boolean;
  focus?: 'first' | 'last';
};

/**
 * Resolves the keyboard boundary between the search input and a projected
 * listbox. Actual DOM focus is applied by the shared menu controller.
 */
export function getSearchKeyboardTransition({
  disabled,
  isExpanded,
  hasResults,
  key,
}: {
  disabled: boolean;
  isExpanded: boolean;
  hasResults: boolean;
  key: string;
}): SearchKeyboardTransition {
  if (disabled) return { blocked: true };

  if (key === 'Escape' && isExpanded) {
    return { blocked: false, nextExpanded: false };
  }

  if (!hasResults || (key !== 'ArrowDown' && key !== 'ArrowUp')) {
    return { blocked: false };
  }

  if (key === 'ArrowDown') {
    return isExpanded
      ? { blocked: false, focus: 'first' }
      : { blocked: false, nextExpanded: true, focus: 'first' };
  }

  return isExpanded
    ? { blocked: false, focus: 'last' }
    : { blocked: false, nextExpanded: true, focus: 'last' };
}
