import type {
  ClassNameComponent,
  ElementClasses,
  SwitchInterface,
  SwitchProps,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  keyof SwitchProps | 'class' | 'children' | 'onclick' | 'onkeydown'
>;

/**
 * Switches toggle the selection of a single item on or off.
 *
 * @status beta
 * @category Input
 * @devx
 * - `checked` is bindable (`bind:checked`); `defaultChecked` initializes uncontrolled use. To
 *   reject a change, bind with a function binding whose setter decides.
 * - The thumb slide is driven by the shared `@udixio/core/dom` Anime.js tween controller, the same
 *   controller used by React and Angular.
 * @a11y
 * - Renders `role="switch"` with `aria-checked` and standard Space/Enter activation.
 * @limitations
 * - The component does not render a visible label; provide one with `aria-label` or
 *   `aria-labelledby`.
 */
export interface SvelteSwitchProps extends SwitchProps, ForwardedAttributes {
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?: ElementClasses<SwitchInterface> | ClassNameComponent<SwitchInterface>;
  /** Notifies an accepted checked-state request. */
  onCheckedChange?: (checked: boolean) => void;
  /** Handles pointer activation after the state request. */
  onclick?: (
    event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement },
  ) => void;
  /** Handles keyboard input after Space/Enter activation has been processed. */
  onkeydown?: (
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement },
  ) => void;
}
