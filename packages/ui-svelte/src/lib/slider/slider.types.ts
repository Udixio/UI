import type {
  ClassNameComponent,
  ElementClasses,
  SliderInterface,
  SliderProps,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  keyof SliderProps | 'class' | 'children' | 'role' | 'tabindex' | 'onkeydown' | 'onblur'
>;

/**
 * Sliders let users make selections from a range of values.
 *
 * @status beta
 * @category Input
 * @devx
 * - `value` is bindable (`bind:value`); `defaultValue` initializes uncontrolled use. To reject a
 *   change, bind with a function binding whose setter decides.
 * - `valueFormatter` formats both the drag indicator and `aria-valuetext`.
 * - Use `-Infinity`/`Infinity` on `min`/`max`, with a matching `marks` entry, for an open-ended range.
 * @a11y
 * - Renders `role="slider"` with `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext`.
 * - Focusable and responds to ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End; `disabled` removes it from the tab order.
 * - Provide `aria-label` or `aria-labelledby`; this component does not render label text.
 * @limitations
 * - Single-thumb only; there is no dual-thumb range-selection mode.
 * - Horizontal orientation only.
 */
export interface SvelteSliderProps extends SliderProps, ForwardedAttributes {
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?: ElementClasses<SliderInterface> | ClassNameComponent<SliderInterface>;
  /** Handles keyboard input after slider transitions have been processed. */
  onkeydown?: (
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement },
  ) => void;
  /** Handles focus leaving the slider after its indicator is hidden. */
  onblur?: (
    event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement },
  ) => void;
}
