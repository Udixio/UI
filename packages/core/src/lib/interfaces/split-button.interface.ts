import type { Icon } from '../icon';
import type { ButtonAdditionalProps } from './button.interface';
import type { IconButtonAdditionalProps } from './icon-button.interface';

export type SplitButtonVariant = 'elevated' | 'filled' | 'tonal' | 'outlined';
export type SplitButtonSize =
  'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';

/** A related action shown in a SplitButton's menu. */
export interface SplitButtonAction {
  /** Unique, non-empty stable identity used by framework renderers. */
  id: string;
  /** Non-empty visible and accessible action label. */
  label: string;
  /** Optional leading icon. */
  icon?: Icon;
  /** Optional navigation destination. */
  href?: string;
  /** Prevents activation and keyboard focus. */
  disabled?: boolean;
}

/**
 * A primary action paired with a menu button for related actions.
 */
export interface SplitButtonProps {
  /** Visible label for the primary action. Provide `icon` for an icon-only action. */
  label?: string;
  /** Optional icon shown before the primary action label. */
  icon?: Icon;
  /** Accessible-name override for the primary action when it has no visible label. */
  accessibleLabel?: string;
  /** Accessible name shared by the trailing menu button and its menu. */
  menuLabel: string;
  /**
   * Related menu actions. Include at least one action with a unique, non-empty
   * `id` and a non-empty `label` for each record.
   */
  actions: readonly SplitButtonAction[];
  /** Visual treatment. @default 'filled' */
  variant?: SplitButtonVariant;
  /** Visual size. Every size keeps a 48px touch target. @default 'small' */
  size?: SplitButtonSize;
  /** Extra Button options. SplitButton supplies its content and owns size, variant, shape, and disabled state. */
  primaryButtonProps?: ButtonAdditionalProps;
  /** Extra IconButton options. SplitButton supplies its content and owns size, variant, shape, and disabled state. */
  menuButtonProps?: IconButtonAdditionalProps;
  /** Disables the primary action, menu trigger, and every menu action. */
  disabled?: boolean;
  /** Controlled visibility of the related-actions menu. */
  open?: boolean;
  /** Initial menu visibility when `open` is uncontrolled. @default false */
  defaultOpen?: boolean;
}

export interface SplitButtonStates {
  /** Resolved visibility of the related-actions menu. */
  isOpen: boolean;
}

export interface SplitButtonInterface {
  type: 'div';
  props: SplitButtonProps;
  states: SplitButtonStates;
  elements: [
    'splitButton',
    'primaryButton',
    'primaryTouchTarget',
    'primaryStateLayer',
    'primaryIcon',
    'primaryLabel',
    'menuButton',
    'menuTouchTarget',
    'menuStateLayer',
    'menuIcon',
    'menuSurface',
  ];
}
