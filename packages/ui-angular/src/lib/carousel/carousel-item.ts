import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  carouselItemStyle,
  type CarouselItemInterface,
  type ClassNameComponent,
} from '@udixio/core';
import { createStyle } from '../utils/create-style';
import { CAROUSEL_CONTEXT } from './carousel-context';

/**
 * A single slide inside a `lib-carousel`. Its width is driven by the
 * carousel's scroll position; it simply projects its content.
 *
 * @status beta
 * @parent Carousel
 * @devx Intended for use inside `lib-carousel`, which stamps sizing and slide semantics on this component's host element.
 * @a11y Rendered inside `lib-carousel` as a `group` with `aria-roledescription="slide"` and an accessible name; used standalone it is a plain container with no slide role.
 * @limitations Sizing (`outputRange`) is inherited from the parent carousel; used on its own the item has no min/max width unless `outputRange` is set explicitly.
 */
@Component({
  selector: 'lib-carousel-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "styles()['carouselItem']",
    '[style.width]': "'var(--carousel-item-width, 100%)'",
    '[style.maxWidth.px]': 'resolvedOutputRange()?.[1] ?? null',
    '[style.minWidth.px]': 'resolvedOutputRange()?.[0] ?? null',
  },
  template: `<ng-content />`,
})
export class CarouselItem {
  readonly outputRange = input<[number, number]>();
  readonly className = input<
    string | ClassNameComponent<CarouselItemInterface>
  >();

  // The carousel's DOM controller writes --carousel-item-width and
  // display directly onto this component's host element (queried via
  // contentChildren), so the host itself must be the styled, measured box
  // -- not a `display: contents` pass-through wrapping an inner div, which
  // would leave the controller's writes on a transparent element instead
  // of the real flex item.
  private readonly context = inject(CAROUSEL_CONTEXT, { optional: true });
  protected readonly resolvedOutputRange = computed(
    () => this.outputRange() ?? this.context?.outputRange(),
  );

  protected readonly styles = createStyle(carouselItemStyle, () => ({
    outputRange: this.resolvedOutputRange(),
    className: this.className(),
  }));
}
