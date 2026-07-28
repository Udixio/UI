import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  type ClassNameComponent,
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
 */
@Component({
  selector: 'lib-divider',
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

  /** Classes or state-aware element classes applied through the shared style contract. */
  readonly className = input<string | ClassNameComponent<DividerInterface>>();

  protected readonly ariaOrientation = computed(() =>
    this.orientation() === 'vertical' ? 'vertical' : null,
  );

  protected readonly styles = createStyle(dividerStyle, () => ({
    orientation: this.orientation(),
    className: this.className(),
  }));
}
