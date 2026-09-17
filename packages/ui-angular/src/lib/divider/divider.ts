import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  type ClassNameComponent,
  type ElementClasses,
  mergeClassNames,
  type DividerInterface,
  type DividerProps,
  dividerStyle,
} from '@udixio/core';
import { createStyle } from '../utils/create-style';

/**
 * Dividers are thin lines that group content in lists or other containers
 * @status beta
 * @category Layout
 * @devx
 * - Renders a semantic `<hr>`; use `orientation` for vertical dividers.
 * @a11y
 * - Renders a native `<hr>`, exposing the implicit `separator` role without extra ARIA.
 * - Sets `aria-orientation="vertical"` when `orientation="vertical"`, since the implicit default for `separator` is horizontal.
 * @limitations
 * - Purely decorative; there is no `decorative`/`aria-hidden` escape hatch, so every divider is announced as a separator to assistive technology.
 * - `[class.x]` and `[ngClass]` bind to the `display: contents` host and have no visible effect; use `class`, `[class]`, or `classes`.
 */
@Component({
  selector: 'udx-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <hr
      [class]="styles()['divider']"
      [attr.aria-orientation]="ariaOrientation()"
    />
  `,
})
export class Divider {
  readonly orientation = input<DividerProps['orientation']>('horizontal');

  /** Classes applied to the root element. Angular's native `class` attribute and `[class]` binding land here, merged with the component's own classes. */
  readonly hostClass = input<string>('', { alias: 'class' });

  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  readonly classes = input<
    ElementClasses<DividerInterface> | ClassNameComponent<DividerInterface>
  >();

  protected readonly ariaOrientation = computed(() =>
    this.orientation() === 'vertical' ? 'vertical' : null,
  );

  protected readonly styles = createStyle(dividerStyle, () => ({
    orientation: this.orientation(),
    className: mergeClassNames<DividerInterface>(
      'divider',
      this.classes(),
      this.hostClass(),
    ),
  }));
}
