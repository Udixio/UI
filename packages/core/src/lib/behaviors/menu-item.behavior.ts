import type { MenuItemSelectionType } from '../interfaces/menu-item.interface.js';
import type { MenuPurpose } from '../interfaces/menu.interface.js';

export type MenuItemRole =
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'option';

export function getMenuItemRole({
  purpose,
  selectionType,
}: {
  purpose: MenuPurpose;
  selectionType: MenuItemSelectionType;
}): MenuItemRole {
  if (purpose === 'selection') return 'option';
  if (selectionType === 'multiple') return 'menuitemcheckbox';
  if (selectionType === 'single') return 'menuitemradio';
  return 'menuitem';
}

/** Shared decision for a user request to select or toggle a menu item. */
export function getMenuItemSelectionTransition({
  disabled,
  selectionType,
  selected,
}: {
  disabled: boolean;
  selectionType: MenuItemSelectionType;
  selected: boolean;
}): { blocked: boolean; nextSelected?: boolean } {
  if (disabled || selectionType === 'none') return { blocked: true };
  if (selectionType === 'single' && selected) return { blocked: true };
  return {
    blocked: false,
    nextSelected: selectionType === 'multiple' ? !selected : true,
  };
}
