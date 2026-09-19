import type {
  ClassNameComponent,
  ElementClasses,
  StateLayerInterface,
  StateLayerProps,
} from '@udixio/core';

/**
 * Paints the Material 3 state layer over its trigger, and drives the press
 * ripple.
 *
 * @status beta
 * @category Interaction
 * @devx
 * - Building block used by every interactive component (`Button`, `Chip`, `Switch`, ...); it is
 *   rendered inside the element it decorates, never standalone.
 * - `colorName` is a theme token without the `--color-` prefix, and it is the
 *   content colour of the surface being decorated -- `on-primary` on a filled
 *   button, `on-primary-container` once that button is repainted onto a
 *   container. An unknown token degrades to `on-surface`.
 * - `stateClassName` selects the Tailwind utility driving the CSS states. The
 *   `state-ripple-group-[name]` form pairs with a `group/name` class on the
 *   trigger, and the layer attaches its ripple to that same element, so the
 *   CSS states and the JavaScript gesture always agree on what the trigger is.
 * - `state-layer` (the non-group form) is CSS-only: no ripple is wired.
 * @a11y
 * - Decorative only: the layer carries `aria-hidden` and takes no pointer
 *   events, so it never reaches the accessibility tree nor intercepts input.
 * - The press ripple honours the reduced-motion preference through the shared
 *   controller.
 * @limitations
 * - Must be rendered inside the element carrying the named Tailwind group,
 *   which is the trigger it attaches to.
 * - `colorName` is typed as `string`: the valid tokens are not visible from
 *   here, so a typo degrades to `on-surface` instead of failing to compile.
 * - `classes` takes the state-aware function form, but it resolves no
 *   interaction states -- hover, focus and press live in the Tailwind
 *   utilities, not in JavaScript.
 */
export interface SvelteStateLayerProps extends StateLayerProps {
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?: ElementClasses<StateLayerInterface> | ClassNameComponent<StateLayerInterface>;
}
