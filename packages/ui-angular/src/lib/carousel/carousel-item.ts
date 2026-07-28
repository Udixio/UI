import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  carouselItemStyle,
  type CarouselItemInterface,
  type ClassNameComponent,
} from '@udixio/core';
import { createStyle } from '../utils/create-style';

/**
 * A single slide inside a `lib-carousel`. Its width is driven by the
 * carousel's scroll position; it simply projects its content.
 *
 * @status beta
 * @parent Carousel
 * @devx Intended for use inside `lib-carousel`, which stamps sizing and slide semantics on this component's host element.
 * @a11y Rendered inside `lib-carousel` as a `group` with `aria-roledescription="slide"` and an accessible name; used standalone it is a plain container with no slide role.
 * @limitations Sizing (`outputRange`) is provided by the parent carousel; used on its own the item has no min/max width.
 */
@Component({
  selector: 'lib-carousel-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div
      [class]="styles()['carouselItem']"
      style="width: var(--carousel-item-width, 100%)"
      [style.maxWidth.px]="outputRange()?.[1] ?? null"
      [style.minWidth.px]="outputRange()?.[0] ?? null"
    >
      <ng-content />
    </div>
  `,
})
export class CarouselItem {
  readonly outputRange = input<[number, number]>();
  readonly className = input<
    string | ClassNameComponent<CarouselItemInterface>
  >();

  protected readonly styles = createStyle(carouselItemStyle, () => ({
    outputRange: this.outputRange(),
    className: this.className(),
  }));
}
