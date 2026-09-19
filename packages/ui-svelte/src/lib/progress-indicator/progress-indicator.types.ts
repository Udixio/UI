import type {
  ClassNameComponent,
  ElementClasses,
  ProgressIndicatorInterface,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';

type ProgressIndicatorProps = ProgressIndicatorInterface['props'];

/**
 * Native attributes forwarded to the root element. The root is a `div` or an
 * `svg` depending on the variant, so only the attributes both accept are
 * exposed -- the same surface the Angular adapter declares explicitly.
 */
type ForwardedAttributes = Pick<
  HTMLAttributes<HTMLElement>,
  'id' | 'style' | 'title' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden'
> & { [key: `data-${string}`]: unknown };

/**
 * Progress indicators express an unspecified wait time or display the length
 * of a process.
 *
 * @status beta
 * @category Communication
 * @devx
 * - `value` is clamped to 0–100; indeterminate variants ignore it.
 * @a11y
 * - Renders `role="progressbar"` with `aria-valuemin`/`aria-valuemax`; determinate
 *   variants also expose `aria-valuenow`.
 * - Provide `aria-label` or `aria-labelledby`; this component does not infer an
 *   accessible name.
 * @limitations
 * - Visibility auto-hides at 100% (no controlled open prop).
 */
export interface SvelteProgressIndicatorProps extends ProgressIndicatorProps, ForwardedAttributes {
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?:
    | ElementClasses<ProgressIndicatorInterface>
    | ClassNameComponent<ProgressIndicatorInterface>;
}
