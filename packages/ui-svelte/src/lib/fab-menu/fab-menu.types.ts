import type {
  ClassNameComponent,
  ElementClasses,
  FabMenuAction,
  FabMenuInterface,
  FabMenuProps,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof FabMenuProps | 'class' | 'children'>;

/**
 * FabMenu exposes related primary actions from one toggleable FAB.
 *
 * @status stable
 * @category Action
 * @devx `open` is bindable; `defaultOpen` initializes uncontrolled use. Actions are a framework-independent model.
 * @a11y
 * - The trigger exposes `aria-expanded`/`aria-controls`.
 * - Opening the menu from the trigger, with a pointer or the keyboard, moves focus to the first enabled action without scrolling the page; an open from code (`open`, `defaultOpen`) leaves focus where it is.
 * - Escape closes and restores trigger focus; outside press closes the group.
 * @limitations Consumers own action-specific side effects through `onActionSelect`.
 */
export interface SvelteFabMenuProps extends FabMenuProps, ForwardedAttributes {
  /** Classes merged onto the menu root. */
  class?: string;
  /** State-aware classes for the trigger, actions, and containers. */
  classes?: ElementClasses<FabMenuInterface> | ClassNameComponent<FabMenuInterface>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onActionSelect?: (action: FabMenuAction, index: number) => void;
}
