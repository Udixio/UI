import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  clampProgressValue,
  isDeterminateVariant,
  progressIndicatorStyle,
  type ClassNameComponent,
  type ProgressIndicatorInterface,
  type ProgressIndicatorVariant,
} from '@udixio/core';
import {
  createCircularProgressController,
  createLinearIndeterminateController,
  createProgressVisibilityController,
} from '@udixio/core/dom';
import { createStyle } from '../utils/create-style';

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
 * - Provide `aria-label`/`aria-labelledby`; this component does not infer an
 *   accessible name.
 * @limitations
 * - Visibility auto-hides at 100% (no controlled open prop).
 */
@Component({
  selector: 'udx-progress-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @switch (variant()) {
      @case ('linear-indeterminate') {
        <div
          [class]="styles()['progressIndicator']"
          role="progressbar"
          [attr.aria-valuemin]="0"
          [attr.aria-valuemax]="100"
          [attr.aria-label]="ariaLabel()"
          [attr.aria-labelledby]="ariaLabelledBy()"
        >
          <div
            #leadingBar
            style="flex-shrink: 0"
            [class]="styles()['activeIndicator']"
          ></div>
          <div
            #gapTrack
            style="flex-shrink: 0"
            [class]="styles()['firstTrack']"
          ></div>
          <div
            #trailingBar
            style="flex-shrink: 0; margin-left: 6px"
            [class]="styles()['activeIndicator']"
          ></div>
          <div style="margin-left: 6px" [class]="styles()['lastTrack']"></div>
        </div>
      }
      @case ('linear-determinate') {
        <div
          [class]="styles()['progressIndicator']"
          role="progressbar"
          [attr.aria-valuemin]="0"
          [attr.aria-valuemax]="100"
          [attr.aria-valuenow]="ariaValueNow()"
          [attr.aria-label]="ariaLabel()"
          [attr.aria-labelledby]="ariaLabelledBy()"
        >
          <div
            [style.width.%]="completedPercentage()"
            [style.transition]="activeIndicatorTransition()"
            [class]="styles()['activeIndicator']"
          ></div>
          <div
            [style.marginLeft]="lastTrackMarginLeft()"
            [style.transition]="lastTrackTransition()"
            [class]="styles()['lastTrack']"
          ></div>
          <div
            style="width: 4px"
            [style.transition]="stopTransition()"
            [class]="styles()['stop']"
          ></div>
        </div>
      }
      @case ('circular-indeterminate') {
        <svg
          #indeterminateSvg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          [class]="styles()['progressIndicator']"
          role="progressbar"
          [attr.aria-valuemin]="0"
          [attr.aria-valuemax]="100"
          [attr.aria-label]="ariaLabel()"
          [attr.aria-labelledby]="ariaLabelledBy()"
        >
          <circle
            #indeterminateCircle
            cx="50%"
            cy="50%"
            r="calc(50% - 2px)"
            style="stroke-linecap: round"
            [class]="styles()['activeIndicator']"
          />
        </svg>
      }
      @case ('circular-determinate') {
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          style="transform: rotate(-90deg)"
          [class]="styles()['progressIndicator']"
          role="progressbar"
          [attr.aria-valuemin]="0"
          [attr.aria-valuemax]="100"
          [attr.aria-valuenow]="ariaValueNow()"
          [attr.aria-label]="ariaLabel()"
          [attr.aria-labelledby]="ariaLabelledBy()"
        >
          <circle
            cx="50%"
            cy="50%"
            [attr.r]="circularRadius()"
            style="stroke-linecap: round"
            [style.stroke-dasharray]="circumference()"
            [style.stroke-dashoffset]="strokeDashoffset()"
            [style.transition]="
              'stroke-dashoffset ' + transitionDuration() + 'ms ease-in-out'
            "
            [class]="styles()['activeIndicator']"
          />
        </svg>
      }
    }
  `,
})
export class ProgressIndicator {
  readonly variant = input<ProgressIndicatorVariant>('linear-determinate');
  readonly value = input<number>(0);
  readonly transitionDuration = input<number>(1000);
  readonly minHeight = input<number>();
  readonly className = input<
    string | ClassNameComponent<ProgressIndicatorInterface>
  >();
  /** Accessible-name override; this component does not infer one. */
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  /** Id reference for text that names the indicator. */
  readonly ariaLabelledBy = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  private readonly indeterminateSvg =
    viewChild<ElementRef<SVGSVGElement>>('indeterminateSvg');
  private readonly indeterminateCircle = viewChild<
    ElementRef<SVGCircleElement>
  >('indeterminateCircle');
  private readonly leadingBar =
    viewChild<ElementRef<HTMLDivElement>>('leadingBar');
  private readonly gapTrack = viewChild<ElementRef<HTMLDivElement>>('gapTrack');
  private readonly trailingBar =
    viewChild<ElementRef<HTMLDivElement>>('trailingBar');

  protected readonly completedPercentage = computed(() =>
    clampProgressValue(this.value()),
  );
  protected readonly isVisible = signal(this.completedPercentage() < 100);
  protected readonly ariaValueNow = computed(() =>
    isDeterminateVariant(this.variant()) ? this.completedPercentage() : null,
  );
  protected readonly circularRadius = computed(() =>
    this.isVisible() ? 22 : 24,
  );
  protected readonly circumference = computed(
    () => 2 * Math.PI * this.circularRadius(),
  );
  protected readonly strokeDashoffset = computed(
    () => this.circumference() * (1 - this.completedPercentage() / 100),
  );
  protected readonly activeIndicatorTransition = computed(
    () =>
      `width ${this.transitionDuration()}ms ease-in-out${
        this.completedPercentage() === 100
          ? ', max-height 200ms 0.5s ease-in-out'
          : ''
      }`,
  );
  protected readonly lastTrackMarginLeft = computed(() =>
    this.completedPercentage() !== 100 ? '6px' : '0px',
  );
  protected readonly lastTrackTransition = computed(() => {
    const duration = this.transitionDuration();
    return `width ${duration}ms ease-in-out${
      this.completedPercentage() === 100
        ? `, max-height 200ms 0.5s ease-in-out, margin-left ${duration}ms ${duration / 1.5}ms`
        : ''
    }`;
  });
  protected readonly stopTransition = computed(
    () =>
      `width ${this.transitionDuration()}ms ease-in-out, max-height 200ms 0.5s ease-in-out`,
  );

  protected readonly styles = createStyle(progressIndicatorStyle, () => ({
    className: this.className(),
    variant: this.variant(),
    value: this.value(),
    transitionDuration: this.transitionDuration(),
    minHeight: this.minHeight(),
    isVisible: this.isVisible(),
  }));

  constructor() {
    afterRenderEffect((onCleanup) => {
      onCleanup(
        createProgressVisibilityController({
          completedPercentage: this.completedPercentage(),
          transitionDuration: this.transitionDuration(),
          onVisibilityChange: (isVisible) => this.isVisible.set(isVisible),
        }),
      );
    });

    afterRenderEffect((onCleanup) => {
      if (this.variant() !== 'circular-indeterminate') return;
      const svg = this.indeterminateSvg()?.nativeElement;
      const circle = this.indeterminateCircle()?.nativeElement;
      if (!svg || !circle) return;

      onCleanup(createCircularProgressController({ svg, circle }));
    });

    afterRenderEffect((onCleanup) => {
      if (this.variant() !== 'linear-indeterminate') return;
      const leadingBar = this.leadingBar()?.nativeElement;
      const gapTrack = this.gapTrack()?.nativeElement;
      const trailingBar = this.trailingBar()?.nativeElement;
      if (!leadingBar || !gapTrack || !trailingBar) return;

      onCleanup(
        createLinearIndeterminateController({
          leadingBar,
          gapTrack,
          trailingBar,
        }),
      );
    });
  }
}
