import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  input,
  output,
  signal,
  viewChild,
  type OnInit,
} from '@angular/core';
import {
  addDays,
  addMonthsClamped,
  buttonStyle,
  classNames,
  datePickerStyle,
  formatMonthLabel,
  getButtonStateColor,
  getCalendarWeeks,
  getDaySelectionState,
  getStartOfWeek,
  getWeekDayLabels,
  getYearRange,
  isDateDisabled,
  resolveDatePickerSelection,
  type ButtonVariant,
  type CalendarDay,
  type ClassNameComponent,
  type DatePickerInterface,
  type DatePickerProps,
  type DatePickerValue,
  type DateRange,
} from '@udixio/core';
import { createMonthTransitionController } from '@udixio/core/dom';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import { iChevronLeft } from '@udixio/icons-rounded-400/chevron_left';
import { iChevronRight } from '@udixio/icons-rounded-400/chevron_right';
import { Button } from '../button/button';
import { IconButton } from '../icon-button/icon-button';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';

function extractAnchorDate(
  value: DatePickerValue | null | undefined,
): Date | null {
  if (value instanceof Date) return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return null;
}

/**
 * DatePickers let users select a date, or a range of dates.
 *
 * @status beta
 * @category Selection
 * @devx
 * - `mode="range"` switches `value`/`defaultValue`/`valueChange` to `DateRange`; `mode="single"` (the default) uses `Date`. Angular's independent `input()`/`output()` bindings cannot express the mode/value coupling at the type level the way React's discriminated props do; pass a value matching the current `mode`.
 * - `value`/`valueChange` are controlled and support `[(value)]`; `defaultValue` initializes uncontrolled usage.
 * - `minDate`/`maxDate`/`shouldDisableDate` are compared at day granularity: a boundary carrying a time-of-day never disables its own day.
 * @a11y
 * - The day grid uses the composite `grid`/`row`/`gridcell` pattern with one roving `tabIndex` per visible month; Arrow keys move focus by day/week, Home/End jump to the visible week's boundaries, PageUp/PageDown change month (Shift for year).
 * - The selected day's `gridcell` carries `aria-selected`; its focusable day button carries `aria-current="date"` when it is today. Unavailable days stay focusable with `aria-disabled` instead of the native `disabled` attribute, so keyboard users can still traverse past them.
 * @limitations
 * - Does not render its own text input or popup positioning; combine with `Button`/`IconButton` and your own overlay for a popup picker.
 * - The year picker view is a plain scrollable button list without virtualization.
 */
@Component({
  selector: 'udx-date-picker',
  standalone: true,
  imports: [Button, IconButton, Icon, StateLayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div [class]="styles()['datePicker']">
      <div [class]="styles()['header']">
        <udx-button
          variant="text"
          [edgeAligned]="false"
          size="small"
          (click)="toggleViewMode()"
          aria-live="polite"
          [className]="headerButtonClassName()"
        >
          <span class="mr-2">{{
            viewMode() === 'day' ? monthLabel() : viewDate().getFullYear()
          }}</span>
          <udx-icon
            [icon]="chevronDownIcon"
            [className]="
              'w-3 h-3 transition-transform duration-200' +
              (viewMode() === 'year' ? ' rotate-180' : '')
            "
          />
        </udx-button>

        @if (viewMode() === 'day') {
          <div [class]="styles()['monthNav']">
            <udx-icon-button
              size="xSmall"
              shapeFeedback="none"
              (click)="handlePrevMonth()"
              [icon]="chevronLeftIcon"
              label="Previous month"
            />
            <udx-icon-button
              size="xSmall"
              shapeFeedback="none"
              (click)="handleNextMonth()"
              [icon]="chevronRightIcon"
              label="Next month"
            />
          </div>
        }
      </div>

      @if (viewMode() === 'year') {
        <div
          #yearsContainer
          class="h-[280px] overflow-y-auto grid grid-cols-3 gap-2 p-2 scrollbar-hide"
        >
          @for (year of years; track year) {
            <udx-button
              size="small"
              [variant]="year === viewDate().getFullYear() ? 'filled' : 'text'"
              [edgeAligned]="false"
              (click)="handleYearSelect(year)"
              [attr.data-selected]="year === viewDate().getFullYear()"
              [className]="yearButtonClassName(year)"
              [label]="year.toString()"
            />
          }
        </div>
      } @else {
        <div
          #grid
          role="grid"
          [attr.aria-label]="monthLabel()"
          class="flex flex-col gap-y-2"
        >
          <div role="row" [class]="styles()['weekDays']">
            @for (day of weekDayLabels(); track $index) {
              <div role="columnheader" [class]="styles()['weekDay']">
                {{ day }}
              </div>
            }
          </div>

          <div role="rowgroup" #weeksContainer>
            @for (week of weeks(); track $index) {
              <div role="row" [class]="styles()['daysGrid']">
                @for (day of week; track day.date.getTime()) {
                  @if (!day.isCurrentMonth) {
                    <div
                      role="gridcell"
                      aria-hidden="true"
                      [class]="styles()['dayCell']"
                    ></div>
                  } @else {
                    @let selection = daySelection(day.date);
                    @let isTodayDay = isTodayDate(day.date);
                    @let isDisabledDay = isDayDisabled(day.date);
                    @let dayStyles = dayButtonState(
                      day,
                      selection.isSelected,
                      isTodayDay,
                      isDisabledDay
                    );
                    <div
                      role="gridcell"
                      [attr.aria-selected]="selection.isSelected"
                      [class]="dayCellClassName(day, selection)"
                    >
                      <button
                        type="button"
                        [class]="dayStyles['button']"
                        [tabIndex]="isFocusTarget(day.date) ? 0 : -1"
                        [attr.aria-current]="isTodayDay ? 'date' : null"
                        [attr.aria-disabled]="isDisabledDay || null"
                        [attr.data-date]="day.date.toDateString()"
                        (click)="handleDateClick(day.date)"
                        (keydown)="handleDayKeyDown($event, day.date)"
                      >
                        <span [class]="dayStyles['touchTarget']"></span>
                        <udx-state-layer
                          [className]="dayStyles['stateLayer']"
                          [colorName]="
                            dayStateColor(selection.isSelected, isTodayDay)
                          "
                          stateClassName="state-ripple-group-[button]"
                        />
                        <span [class]="dayStyles['label']">{{
                          day.date.getDate()
                        }}</span>
                      </button>
                    </div>
                  }
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class DatePicker implements OnInit {
  readonly mode = input<NonNullable<DatePickerProps['mode']>>('single');
  readonly value = input<DatePickerValue>();
  readonly defaultValue = input<DatePickerValue>(null);
  readonly minDate = input<Date>();
  readonly maxDate = input<Date>();
  readonly shouldDisableDate = input<(date: Date) => boolean>();
  readonly locale = input('default');
  readonly weekStartDay = input<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);
  readonly className = input<string | ClassNameComponent<DatePickerInterface>>();

  /** Emits an accepted selection request and supports `[(value)]`. */
  readonly valueChange = output<DatePickerValue>();

  protected readonly chevronDownIcon = iKeyboardArrowDown;
  protected readonly chevronLeftIcon = iChevronLeft;
  protected readonly chevronRightIcon = iChevronRight;
  protected readonly years = getYearRange(new Date().getFullYear());

  protected readonly viewDate = signal<Date>(new Date());
  protected readonly focusedDate = signal<Date>(new Date());
  protected readonly viewMode = signal<'day' | 'year'>('day');
  private shouldFocusDay = false;

  private readonly gridElement = viewChild<ElementRef<HTMLDivElement>>('grid');
  private readonly yearsContainer =
    viewChild<ElementRef<HTMLDivElement>>('yearsContainer');
  private readonly weeksContainer =
    viewChild<ElementRef<HTMLDivElement>>('weeksContainer');
  private monthTransition?: ReturnType<typeof createMonthTransitionController>;
  private previousViewDate = this.viewDate();

  private readonly valueState = createControllableState<DatePickerValue>({
    value: this.value,
    defaultValue: this.defaultValue,
    onChange: (next) => this.valueChange.emit(next),
    componentName: 'DatePicker',
    stateName: 'value',
  });

  protected readonly resolvedValue = this.valueState.value;
  protected readonly hasSelected = computed(() => this.resolvedValue() !== null);
  protected readonly weeks = computed(() =>
    getCalendarWeeks(this.viewDate(), this.weekStartDay()),
  );
  protected readonly weekDayLabels = computed(() =>
    getWeekDayLabels(this.locale(), this.weekStartDay()),
  );
  protected readonly monthLabel = computed(() =>
    formatMonthLabel(this.viewDate(), this.locale()),
  );

  protected readonly styles = createStyle(datePickerStyle, () => ({
    mode: this.mode(),
    value: this.value(),
    defaultValue: this.defaultValue(),
    minDate: this.minDate(),
    maxDate: this.maxDate(),
    shouldDisableDate: this.shouldDisableDate(),
    locale: this.locale(),
    weekStartDay: this.weekStartDay(),
    hasSelected: this.hasSelected(),
    className: this.className(),
    // `DatePickerProps` is a mode-discriminated union (see date-picker.ts's
    // TSDoc) so consumers can't mix `mode`/`value` shapes; the shared
    // style-hook signature wants one flat `props & states` bag, so the merged
    // runtime state is widened back for this call only. Never a public
    // contract.
  }) as unknown as Parameters<typeof datePickerStyle>[0]);

  protected readonly headerButtonClassName = computed(() =>
    classNames(this.styles()['monthLabel'], 'hover:bg-surface-container-highest'),
  );

  constructor() {
    afterRenderEffect(() => {
      if (this.viewMode() !== 'year') return;
      this.scrollToSelectedYear();
    });

    afterRenderEffect(() => {
      // Reads focusedDate/viewDate so this reruns after keyboard navigation
      // moves either signal; shouldFocusDay gates it to that trigger only.
      const key = this.focusedDate().toDateString();
      void this.viewDate();
      if (!this.shouldFocusDay) return;
      this.shouldFocusDay = false;
      this.focusDayButton(key);
    });

    afterRenderEffect((onCleanup) => {
      const container = this.weeksContainer()?.nativeElement;
      if (!container) return;
      const controller = createMonthTransitionController({ container });
      this.monthTransition = controller;
      onCleanup(() => controller.destroy());
    });

    afterRenderEffect(() => {
      const current = this.viewDate();
      const previous = this.previousViewDate;
      this.previousViewDate = current;
      const direction =
        current.getTime() === previous.getTime()
          ? 0
          : current > previous
            ? 1
            : -1;
      this.monthTransition?.play(direction);
    });
  }

  private focusDayButton(key: string): void {
    const grid = this.gridElement()?.nativeElement;
    const target = grid?.querySelector<HTMLButtonElement>(`[data-date="${key}"]`);
    if (target) {
      target.focus();
      return;
    }
    // A month change replaces every day button via @for; this component's
    // own render hook can observe that swap one tick behind the signal
    // write in some render/CD interleavings. Retry once the pending view
    // update has definitely flushed.
    setTimeout(() => {
      this.gridElement()
        ?.nativeElement?.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)
        ?.focus();
    });
  }

  private scrollToSelectedYear(): void {
    const scrolled = this.scrollSelectedYearIntoView();
    if (scrolled) return;
    // Switching to the year view mounts the scrollable list in the same
    // render pass this render hook observes; the list's layout (and thus a
    // meaningful scrollIntoView) can still be pending on that first run in
    // some render/CD interleavings. Retry once it has settled.
    setTimeout(() => this.scrollSelectedYearIntoView());
  }

  private scrollSelectedYearIntoView(): boolean {
    const container = this.yearsContainer()?.nativeElement;
    // `data-selected` sits on <udx-button>, whose host renders with
    // `display: contents` and therefore has no box of its own; scrolling
    // must target its actual native <button> descendant instead.
    const selected = container
      ?.querySelector('[data-selected="true"]')
      ?.querySelector('button');
    if (!selected) return false;
    selected.scrollIntoView({ block: 'center' });
    return true;
  }

  ngOnInit(): void {
    this.valueState.initialize();
    const anchor =
      extractAnchorDate(this.value()) ??
      extractAnchorDate(this.defaultValue()) ??
      new Date();
    const initialViewDate = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    this.viewDate.set(initialViewDate);
    this.focusedDate.set(anchor);
    // Matches the real initial month so the first transition effect run
    // computes direction 0 instead of replaying an animation on mount.
    this.previousViewDate = initialViewDate;
  }

  protected toggleViewMode(): void {
    this.viewMode.update((m) => (m === 'day' ? 'year' : 'day'));
  }

  protected handlePrevMonth(): void {
    this.viewDate.update((d) => addMonthsClamped(d, -1));
  }

  protected handleNextMonth(): void {
    this.viewDate.update((d) => addMonthsClamped(d, 1));
  }

  protected handleYearSelect(year: number): void {
    this.viewDate.update((d) => new Date(year, d.getMonth(), 1));
    this.viewMode.set('day');
  }

  protected handleDateClick(date: Date): void {
    if (this.isDayDisabled(date)) return;
    this.goToDate(date);
    this.valueState.set(
      resolveDatePickerSelection(this.mode(), this.resolvedValue(), date),
    );
  }

  protected handleDayKeyDown(event: KeyboardEvent, date: Date): void {
    let next: Date | undefined;
    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(date, -1);
        break;
      case 'ArrowRight':
        next = addDays(date, 1);
        break;
      case 'ArrowUp':
        next = addDays(date, -7);
        break;
      case 'ArrowDown':
        next = addDays(date, 7);
        break;
      case 'Home':
        next = getStartOfWeek(date, this.weekStartDay());
        break;
      case 'End':
        next = addDays(getStartOfWeek(date, this.weekStartDay()), 6);
        break;
      case 'PageUp':
        next = addMonthsClamped(date, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonthsClamped(date, event.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    this.goToDate(next);
  }

  private goToDate(next: Date): void {
    this.shouldFocusDay = true;
    this.focusedDate.set(next);
    const view = this.viewDate();
    if (
      next.getFullYear() !== view.getFullYear() ||
      next.getMonth() !== view.getMonth()
    ) {
      this.viewDate.set(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }

  protected isTodayDate(date: Date): boolean {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  protected isDayDisabled(date: Date): boolean {
    return isDateDisabled(date, {
      minDate: this.minDate(),
      maxDate: this.maxDate(),
      shouldDisableDate: this.shouldDisableDate(),
    });
  }

  protected isFocusTarget(date: Date): boolean {
    return date.toDateString() === this.focusedDate().toDateString();
  }

  protected daySelection(date: Date) {
    return getDaySelectionState(this.mode(), this.resolvedValue(), date);
  }

  protected dayCellClassName(
    day: CalendarDay,
    selection: ReturnType<typeof getDaySelectionState>,
  ): string {
    const range = this.resolvedValue() as DateRange | null;
    return classNames(
      this.styles()['dayCell'],
      selection.isInRange && 'bg-primary/20',
      selection.isStart &&
        range?.[1] &&
        'bg-gradient-to-r from-transparent to-primary/20',
      selection.isEnd &&
        range?.[0] &&
        'bg-gradient-to-l from-transparent to-primary/20',
    );
  }

  protected dayStateColor(isSelected: boolean, isTodayDay: boolean): string {
    const variant: ButtonVariant = isSelected
      ? 'filled'
      : isTodayDay
        ? 'outlined'
        : 'text';
    return getButtonStateColor({ variant, toggleable: false, isPressed: false });
  }

  protected dayButtonState(
    day: CalendarDay,
    isSelected: boolean,
    isTodayDay: boolean,
    isDisabledDay: boolean,
  ): Record<string, string> {
    const variant: ButtonVariant = isSelected
      ? 'filled'
      : isTodayDay
        ? 'outlined'
        : 'text';
    return buttonStyle({
      type: 'button',
      variant,
      size: 'small',
      icon: undefined,
      iconPosition: 'start',
      disabled: false,
      edgeAligned: true,
      loading: false,
      shape: 'rounded',
      shapeFeedback: 'none',
      transition: undefined,
      toggleable: false,
      pressed: undefined,
      defaultPressed: false,
      label: day.date.getDate().toString(),
      isPressed: false,
      className: () => ({
        button: classNames(this.styles()['dayButton'], 'p-0', {
          'text-on-surface': !isSelected && !isTodayDay,
          'opacity-50': isDisabledDay,
        }),
        stateLayer: classNames({ '!bg-transparent': isDisabledDay }),
      }),
    });
  }

  protected yearButtonClassName(year: number): string {
    return classNames('!w-full', {
      'text-on-surface': year !== this.viewDate().getFullYear(),
    });
  }
}
