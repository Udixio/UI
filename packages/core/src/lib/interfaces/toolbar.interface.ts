import type { IconButtonProps } from './icon-button.interface';
import type { AnchorPosition } from './anchor-positioner.interface';

export type ToolbarVariant = 'docked' | 'floating';
export type ToolbarColor = 'standard' | 'vibrant';
export type ToolbarOrientation = 'horizontal' | 'vertical';

/** An icon action that can be rendered directly or moved into overflow. */
export interface ToolbarAction extends Pick<
  IconButtonProps,
  | 'label'
  | 'icon'
  | 'tooltip'
  | 'pressedIcon'
  | 'variant'
  | 'size'
  | 'width'
  | 'disabled'
  | 'shape'
  | 'shapeFeedback'
  | 'transition'
  | 'toggleable'
  | 'pressed'
  | 'defaultPressed'
> {
  /** Stable identity used by framework renderers. */
  id: string;
  /** Optional navigation destination for link actions. */
  href?: string;
  /** Keeps the action visible when other actions move into overflow. */
  pinned?: boolean;
}

/** Presentation options for the automatically rendered overflow trigger. */
export interface ToolbarMoreProps {
  /** Accessible name of the overflow trigger. @default 'More actions' */
  label?: string;
  /** Icon shown by the overflow trigger. */
  icon?: IconButtonProps['icon'];
  /** Icon button treatment. @default 'standard' */
  variant?: IconButtonProps['variant'];
  /** Icon button size. @default 'small' */
  size?: IconButtonProps['size'];
}

/**
 * Toolbars group related actions in a docked or floating container.
 */
export interface ToolbarProps {
  /**
   * Container presentation.
   * @default 'docked'
   */
  variant?: ToolbarVariant;

  /**
   * Container color treatment.
   * @default 'standard'
   */
  color?: ToolbarColor;

  /**
   * Layout axis for the toolbar's children.
   * @default 'horizontal'
   */
  orientation?: ToolbarOrientation;

  /**
   * Accessible name applied to the toolbar container.
   * Prefer this prop for cross-framework parity; `aria-labelledby` remains
   * available through the framework's native attributes.
   */
  accessibleLabel?: string;

  /**
   * Optional action model. When provided, actions are rendered instead of
   * `children`, and actions beyond the visible limit move into an overflow
   * menu.
   */
  actions?: readonly ToolbarAction[];

  /** Maximum number of non-pinned actions shown in the toolbar. */
  maxVisible?: number;

  /** Measures the toolbar and reserves one action slot for overflow when needed. */
  responsive?: boolean;

  /** Estimated width of one action slot when `responsive` is enabled. @default 48 */
  itemWidth?: number;

  /** Presentation options for the automatically rendered overflow trigger. */
  more?: ToolbarMoreProps;

  /** Position of the generated overflow menu relative to the More trigger. `auto` follows the toolbar orientation and the trigger's viewport half. @default 'auto' */
  morePosition?: AnchorPosition;
}

export interface ToolbarInterface {
  type: 'div';
  props: ToolbarProps;
  states: { isOverflowOpen: boolean };
  elements: ['toolbar'];
}

export interface ToolbarActionSplit {
  visible: readonly ToolbarAction[];
  overflow: readonly ToolbarAction[];
}

/**
 * Splits toolbar actions while keeping pinned actions in their original order.
 * Responsive mode reserves one slot for the overflow trigger as soon as an
 * action no longer fits.
 */
export function splitToolbarActions({
  actions,
  maxVisible,
  responsive = false,
  availableWidth = Number.POSITIVE_INFINITY,
  itemWidth = 48,
}: {
  actions: readonly ToolbarAction[];
  maxVisible?: number;
  responsive?: boolean;
  availableWidth?: number;
  itemWidth?: number;
}): ToolbarActionSplit {
  const shiftable = actions.filter((action) => action.pinned !== true);
  const cap = Math.min(
    Math.max(0, maxVisible ?? shiftable.length),
    shiftable.length,
  );

  let visibleCount = cap;
  if (responsive && Number.isFinite(availableWidth) && itemWidth > 0) {
    const slots = Math.floor(availableWidth / itemWidth);
    const fitted =
      slots >= shiftable.length ? shiftable.length : Math.max(0, slots - 1);
    visibleCount = Math.min(fitted, cap);
  }

  const visibleShiftable = new Set(shiftable.slice(0, visibleCount));
  return {
    visible: actions.filter(
      (action) => action.pinned === true || visibleShiftable.has(action),
    ),
    overflow: shiftable.slice(visibleCount),
  };
}
