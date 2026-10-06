import type {
  ClassNameComponent,
  ElementClasses,
  SplitButtonAction,
  SplitButtonInterface,
  SplitButtonProps,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  keyof SplitButtonProps | 'class' | 'children' | 'role' | 'aria-label'
>;

/**
 * A primary action paired with a menu button for related actions.
 * @status beta
 * @category Action
 * @devx
 * - Provide a visible primary `label` or an `icon`; icon-only usage requires `accessibleLabel`.
 * - `menuLabel` names the trailing menu button and popup. Actions share one framework-independent data model and need unique non-empty IDs and labels.
 * - Both prop bags forward primitive-specific options. SplitButton supplies each part's content and coordinates size, variant, shape, and disabled state.
 * - Each button morphs only its own inner corners on hover, focus-visible, and
 *   press. While the menu is open, only the trailing button keeps its expanded
 *   shape and selected state layer.
 * - `open` is bindable; `defaultOpen` initializes uncontrolled use.
 * @a11y
 * - Composes the shared `Button` and `IconButton` primitives; the menu IconButton exposes `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls`.
 * - Enter and Space open the menu; Arrow Down and Arrow Up open at the first and last enabled actions.
 * - The shared Menu handles item navigation; Escape and outside press close it, and Escape restores trigger focus.
 * - Both button parts retain a 48px touch target and visible focus outline.
 * @limitations The primary action is a callback, and nested menu actions are not supported.
 */
export interface SvelteSplitButtonProps
  extends SplitButtonProps, ForwardedAttributes {
  /** Classes merged onto the split button root. */
  class?: string;
  /** State-aware classes for the group, both button parts, and popup. */
  classes?:
    | ElementClasses<SplitButtonInterface>
    | ClassNameComponent<SplitButtonInterface>;
  /** Controlled visibility; `bind:open` synchronizes the owner. */
  open?: boolean;
  /** Notifies an accepted open-state request. */
  onOpenChange?: (open: boolean) => void;
  /** Runs the primary action. */
  onPrimaryAction?: () => void;
  /** Notifies selection before the menu closes. */
  onActionSelect?: (action: SplitButtonAction, index: number) => void;
}
