import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { NAVIGATION_RAIL_CONTEXT } from './navigation-rail-context';

/**
 * A non-interactive label that groups the `udx-navigation-rail-item`s
 * following it.
 * @status beta
 * @parent NavigationRail
 * @devx
 * - Section labels, and any item placed after one, only render while the
 *   rail is extended.
 * @a11y
 * - Renders as plain text with no role or heading semantics.
 * @limitations
 * - Purely visual: it does not group its items in an ARIA sense (no
 *   `role="group"`/`aria-labelledby` wiring).
 */
@Component({
  selector: 'udx-navigation-rail-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @if (context?.isExtended() ?? true) {
      <div class="h-9 flex items-center mx-9 mt-3">
        <p class="text-label-large text-on-surface-variant">{{ label() }}</p>
      </div>
    }
  `,
})
export class NavigationRailSection {
  /** Text of the group label. */
  readonly label = input.required<string>();

  protected readonly context = inject(NAVIGATION_RAIL_CONTEXT, {
    optional: true,
  });
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** @internal Read by the parent rail to order sections relative to items. */
  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }
}
