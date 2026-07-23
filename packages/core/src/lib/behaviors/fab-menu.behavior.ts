import type { Icon } from '../icon';

export const DEFAULT_FAB_MENU_CLOSE_ICON: Icon =
  '<svg viewBox="0 0 24 24"><path d="M6 6L18 18M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>';

export type FabMenuDismissReason = 'escape' | 'outside';
