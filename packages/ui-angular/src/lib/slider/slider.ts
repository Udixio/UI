import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
  type OnInit,
} from '@angular/core';
import {
  getSliderKeyboardTransition,
  getSliderPercentFromValue,
  SLIDER_KEYBOARD_INDICATOR_TIMEOUT_MS,
  sliderStyle,
  type ClassNameComponent,
  type SliderInterface,
  type SliderMark,
} from '@udixio/core';
import {
  createSliderIndicatorController,
  createSliderPointerController,
  type SliderIndicatorController,
} from '@udixio/core/dom';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';

/**
 * Sliders let users make selections from a range of values.
 *
 * @status beta
 * @category Input
 * @devx
 * - `value`/`valueChange` are controlled; use `defaultValue` for uncontrolled usage and `[(value)]` for two-way binding. Choose one mode for the component's lifetime.
 * - `valueChange` fires once per accepted transition.
 * - Use `-Infinity`/`Infinity` on `min`/`max`, with a matching `marks` entry, for an open-ended range.
 * @a11y
 * - Renders `role="slider"` with `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext`.
 * - Focusable and responds to ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End; `disabled` removes it from the tab order.
 * - Provide `aria-label`/`aria-labelledby`; this component does not render label text.
 * @limitations
 * - Single-thumb only; there is no dual-thumb range-selection mode.
 * - Horizontal orientation only.
 */
@Component({
  selector: 'udx-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div
      #track
      role="slider"
      [tabIndex]="disabled() ? -1 : 0"
      [attr.aria-valuemin]="ariaValueMin()"
      [attr.aria-valuemax]="ariaValueMax()"
      [attr.aria-valuenow]="resolvedValue()"
      [attr.aria-valuetext]="resolvedValue().toString()"
      [attr.aria-disabled]="disabled() || null"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-labelledby]="ariaLabelledBy()"
      [class]="styles()['slider']"
      (keydown)="handleKeyDown($event)"
      (blur)="handleBlur()"
    >
      <input
        type="hidden"
        [name]="name()"
        [value]="resolvedValue()"
        [disabled]="disabled()"
      />
      <div
        [class]="styles()['activeTrack']"
        [style.flex]="percent() / 100"
      ></div>
      <div [class]="styles()['handle']">
        <div class="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 transform">
          <div
            #indicator
            [class]="styles()['valueIndicator']"
            style="transform: scale(0)"
          >
            {{ formattedValue() }}
          </div>
        </div>
      </div>
      <div
        [class]="styles()['inactiveTrack']"
        [style.flex]="1 - percent() / 100"
      ></div>
      <div
        class="w-[calc(100%-12px)] h-full absolute -translate-x-1/2 transform left-1/2"
      >
        @for (mark of resolvedMarks(); track mark.value) {
          <div
            [class]="dotClass(mark.value)"
            [style.left.%]="markPercent(mark.value)"
          ></div>
        }
      </div>
    </div>
  `,
})
export class Slider implements OnInit {
  readonly value = input<number>();
  readonly defaultValue = input(0);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly step = input<number>();
  readonly min = input(0);
  readonly max = input(100);
  readonly marks = input<SliderMark[]>();
  readonly valueFormatter = input<(value: number) => string | number>();
  readonly className = input<string | ClassNameComponent<SliderInterface>>();
  /** Accessible-name override when no visible label is available. */
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  /** Id reference for visible text that names the slider. */
  readonly ariaLabelledBy = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  /** Emits once for each accepted value transition. */
  readonly valueChange = output<number>();

  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');
  private readonly indicator =
    viewChild.required<ElementRef<HTMLElement>>('indicator');

  // A discrete step is the default only when the caller didn't opt into
  // mark-based snapping instead; explicit `marks` without `step` snaps to
  // those marks, matching the mental model "marks replace the default step".
  protected readonly resolvedStep = computed(
    () => this.step() ?? (this.marks() ? undefined : 10),
  );
  protected readonly resolvedMarks = computed(
    () =>
      this.marks() ?? [
        {
          value: this.min() === -Infinity ? 0 : this.min(),
          label: String(this.min() === -Infinity ? 0 : this.min()),
        },
        {
          value: this.max() === Infinity ? 100 : this.max(),
          label: String(this.max() === Infinity ? 100 : this.max()),
        },
      ],
  );

  private readonly valueState = createControllableState({
    value: this.value,
    defaultValue: this.defaultValue,
    onChange: (value) => this.valueChange.emit(value),
    componentName: 'Slider',
    stateName: 'value',
  });
  protected readonly resolvedValue = this.valueState.value;

  // Tracked separately so a keyboard-driven hide-timeout can never cut off
  // an in-progress drag, and vice versa.
  private readonly isDragging = signal(false);
  private readonly isKeyboardActive = signal(false);
  protected readonly isChanging = computed(
    () => this.isDragging() || this.isKeyboardActive(),
  );
  private keyboardIndicatorTimeout?: ReturnType<typeof setTimeout>;

  // Angular templates can't reference the global `Infinity`; resolve the
  // open-ended sentinel to `null` here so `aria-valuemin`/`aria-valuemax`
  // are simply omitted for an open end.
  protected readonly ariaValueMin = computed(() =>
    this.min() === -Infinity ? null : this.min(),
  );
  protected readonly ariaValueMax = computed(() =>
    this.max() === Infinity ? null : this.max(),
  );

  protected readonly percent = computed(() =>
    getSliderPercentFromValue(this.resolvedValue(), {
      min: this.min(),
      max: this.max(),
      marks: this.resolvedMarks(),
    }),
  );

  protected readonly formattedValue = computed(() => {
    const formatter = this.valueFormatter();
    const value = this.resolvedValue();
    return formatter ? formatter(value) : value;
  });

  protected readonly styles = createStyle(sliderStyle, () => ({
    value: this.value(),
    defaultValue: this.defaultValue(),
    disabled: this.disabled(),
    name: this.name(),
    step: this.step(),
    min: this.min(),
    max: this.max(),
    marks: this.marks(),
    valueFormatter: this.valueFormatter(),
    onChange: () => undefined,
    isChanging: this.isChanging(),
    className: this.className(),
  }));

  private indicatorController?: SliderIndicatorController;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const track = this.track().nativeElement;
      const controller = createSliderPointerController({
        track,
        min: () => this.min(),
        max: () => this.max(),
        step: () => this.resolvedStep(),
        marks: () => this.resolvedMarks(),
        disabled: () => this.disabled(),
        onValueChange: (next) => this.valueState.set(next),
        onDraggingChange: (dragging) => this.isDragging.set(dragging),
      });
      destroyRef.onDestroy(() => controller.destroy());

      const indicatorController = createSliderIndicatorController({
        indicator: this.indicator().nativeElement,
      });
      this.indicatorController = indicatorController;
      destroyRef.onDestroy(() => {
        indicatorController.destroy();
        this.indicatorController = undefined;
      });
    });

    afterRenderEffect(() => {
      this.indicatorController?.setVisible(this.isChanging());
    });

    destroyRef.onDestroy(() => clearTimeout(this.keyboardIndicatorTimeout));
  }

  ngOnInit(): void {
    this.valueState.initialize();
  }

  protected markPercent(value: number): number {
    return getSliderPercentFromValue(value, {
      min: this.min(),
      max: this.max(),
      marks: this.resolvedMarks(),
    });
  }

  protected dotClass(value: number): string {
    const dot = this.styles()['dot'];
    const handleAndGapPercent =
      ((this.isChanging() ? 9 : 10) / (this.track().nativeElement.offsetWidth || 1)) *
      100;
    const markPercent = this.markPercent(value);
    const percent = this.percent();

    if (markPercent <= percent - handleAndGapPercent) {
      return `${dot} bg-primary-container`;
    }
    if (markPercent >= percent + handleAndGapPercent) {
      return `${dot} bg-primary`;
    }
    return dot;
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    const transition = getSliderKeyboardTransition({
      key: event.key,
      value: this.resolvedValue(),
      min: this.min(),
      max: this.max(),
      step: this.resolvedStep(),
      marks: this.resolvedMarks(),
      disabled: this.disabled(),
    });
    if (transition.blocked) return;
    event.preventDefault();
    this.valueState.set(transition.nextValue);

    this.isKeyboardActive.set(true);
    clearTimeout(this.keyboardIndicatorTimeout);
    this.keyboardIndicatorTimeout = setTimeout(
      () => this.isKeyboardActive.set(false),
      SLIDER_KEYBOARD_INDICATOR_TIMEOUT_MS,
    );
  }

  protected handleBlur(): void {
    clearTimeout(this.keyboardIndicatorTimeout);
    this.isKeyboardActive.set(false);
  }
}
