import type {
  ClassNameComponent,
  ElementClasses,
  Icon,
  ToolbarAction,
  ToolbarInterface,
  ToolbarMoreProps,
  ToolbarProps,
} from '@udixio/core';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/** Data-driven toolbar action with optional callbacks for framework consumers. */
export interface SvelteToolbarAction extends ToolbarAction {
  /** Runs when an action without an `href` is activated. */
  onClick?: () => void;
  /** Receives accepted toggle-state changes. */
  onToggle?: (pressed: boolean) => void;
}

export interface SvelteToolbarMoreContext {
  actions: readonly SvelteToolbarAction[];
  label: string;
  icon: Icon;
  variant: NonNullable<ToolbarMoreProps['variant']>;
  size: NonNullable<ToolbarMoreProps['size']>;
  open: boolean;
  ariaHasPopup: 'menu';
  ariaExpanded: boolean;
  toggle: () => void;
}

/**
 * Toolbars group related actions in a docked or floating container.
 *
 * @status beta
 * @category Layout
 * @devx
 * - Compose `IconButton` children or other controls, or pass `actions` for a
 *   data-driven action group.
 * - `maxVisible` moves the remaining actions into an automatic overflow menu;
 *   `responsive` derives the visible count from the toolbar width.
 * - `more` customizes the default overflow trigger and `moreTemplate` replaces
 *   its visual rendering while keeping the menu behavior.
 * - The generated overflow menu chooses above/below or left/right from the
 *   toolbar orientation and the trigger's viewport half; `morePosition` can
 *   force a placement.
 * - Descendant `IconButton` controls keep rounded press feedback in floating
 *   toolbars.
 * - Use `variant="floating"` for a compact surface and
 *   `orientation="vertical"` for a vertical action group.
 * @a11y
 * - Renders `role="toolbar"` and applies `aria-orientation="vertical"` for
 *   vertical layouts.
 * - Provide `accessibleLabel` or an `aria-labelledby` reference to name the
 *   toolbar; label each child control according to its own component API.
 * @limitations
 * - The toolbar is a layout wrapper and does not implement roving focus or
 *   arrow-key navigation. Interactive children retain their native behavior.
 * - Composition children remain consumer-owned; use `size="small"` on
 *   `IconButton` for the 48dp toolbar slots shown in Material 3.
 */
export interface SvelteToolbarProps
  extends
    Omit<ToolbarProps, 'actions' | 'more'>,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      | keyof ToolbarProps
      | 'class'
      | 'children'
      | 'role'
      | 'aria-label'
      | 'aria-orientation'
      | 'onkeydown'
    > {
  /** Data-driven actions rendered as icon buttons with automatic overflow. */
  actions?: readonly SvelteToolbarAction[];
  /** Presentation options for the default overflow trigger. */
  more?: ToolbarMoreProps;
  /** Replaces the default overflow trigger while retaining the overflow menu. */
  moreTemplate?: Snippet<[SvelteToolbarMoreContext]>;
  /** Notifies consumers when the generated overflow menu opens or closes. */
  onMoreOpenChange?: (open: boolean) => void;
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?:
    ElementClasses<ToolbarInterface> | ClassNameComponent<ToolbarInterface>;
  /** An alternative accessible name when `accessibleLabel` is not provided. */
  'aria-label'?: string;
  /** An explicit orientation override for the rendered toolbar semantics. */
  'aria-orientation'?: 'horizontal' | 'vertical';
  /** Optional native keyboard listener forwarded to the root element. */
  onkeydown?: (event: KeyboardEvent) => void;
  children?: Snippet;
}
