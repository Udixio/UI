import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  type OnInit,
} from '@angular/core';
import {
  classNames,
  formatTextFieldIsoDate,
  parseTextFieldIsoDate,
  resolveTextFieldFloating,
  resolveTextFieldTrailingIcon,
  sanitizeTextFieldDateInput,
  textFieldStyle,
  type ClassNameComponent,
  type DatePickerValue,
  type Icon as IconType,
  type TextFieldInterface,
  type TextFieldOption,
} from '@udixio/core';
import {
  createTextFieldLabelController,
  createTextareaAutosizeController,
  type TextFieldLabelController,
  type TextareaAutosizeController,
} from '@udixio/core/dom';
import { iCalendarToday } from '@udixio/icons-rounded-400/calendar_today';
import { iError } from '@udixio/icons-rounded-400/error';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import { iKeyboardArrowUp } from '@udixio/icons-rounded-400/keyboard_arrow_up';
import { AnchorPositioner } from '../anchor-positioner/anchor-positioner';
import { Button } from '../button/button';
import { DatePicker } from '../date-picker/date-picker';
import { Divider } from '../divider/divider';
import { Icon } from '../icon/icon';
import { Menu } from '../menu/menu';
import { MenuHeadline } from '../menu/menu-headline';
import { MenuItem } from '../menu/menu-item';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

let nextTextFieldId = 0;

/**
 * Text fields let users enter text into a UI.
 *
 * @status beta
 * @category Input
 * @devx
 * - `value`/`valueChange` are controlled and support `[(value)]`; `defaultValue` initializes uncontrolled usage.
 * - `multiline` switches to an auto-growing textarea.
 * - `type="select"` switches to select mode with `options`; Angular has no equivalent to React's projected `MenuItem` children, so `options` is the only way to populate the menu.
 * - `type="date"` switches to date-picker mode; the field stays typable (`YYYY-MM-DD`).
 * - `mask` transforms typed/pasted input on every keystroke (a card number, a phone number, an
 *   ID); it defaults to the built-in `YYYY-MM-DD` mask for `type="date"`, and providing one
 *   overrides it.
 * - The outlined variant's legend notch uses one `@udixio/core/dom` Anime.js Layout controller, shared with the React adapter -- an accepted exception to the rest of `@udixio/core/dom`, which uses Motion; Motion has no free equivalent to `width: auto` layout diffing. The floating label itself is a plain CSS transition.
 * @a11y
 * - `aria-describedby` links supporting text/error to the input.
 * - `aria-invalid` reflects `errorText`.
 * - The date/select trailing icon is a real `<button>` so it stays keyboard reachable.
 * @limitations
 * - Does not support projecting custom `MenuItem` content the way the React adapter does; use `options`.
 */
@Component({
  selector: 'lib-text-field',
  standalone: true,
  imports: [
    AnchorPositioner,
    Button,
    DatePicker,
    Divider,
    Icon,
    Menu,
    MenuHeadline,
    MenuItem,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div #fieldRoot [class]="styles()['textField']">
      <fieldset
        role="presentation"
        [class]="styles()['content']"
        (click)="handleFieldClick()"
      >
        <div [class]="styles()['stateLayer']"></div>

        @if (leadingIcon()) {
          <div [class]="styles()['leadingIcon']">
            <lib-icon [icon]="leadingIcon()!" className="w-5 h-5" />
          </div>
        }

        <legend #legend aria-hidden="true" [class]="styles()['legend']">
          <span class="inline-flex -translate-y-1/2 opacity-0">{{
            label()
          }}</span>
        </legend>

        <div class="flex-1 relative">
          <label [for]="resolvedId()" [class]="styles()['label']">{{
            label()
          }}</label>

          @if (multiline()) {
            <textarea
              #control
              [id]="resolvedId()"
              [name]="name() ?? null"
              [value]="displayValue()"
              [class]="classNames(styles()['input'], inputSpecialClass())"
              [placeholder]="isFocused() ? (placeholder() ?? '') : ''"
              [disabled]="disabled()"
              [attr.autocomplete]="autoComplete()"
              [attr.aria-invalid]="hasError()"
              [attr.aria-describedby]="
                hasSupportingText() ? helperTextId() : null
              "
              (input)="handleInput($event)"
              (focus)="handleControlFocus()"
              (blur)="handleControlBlur()"
            ></textarea>
          } @else {
            <input
              #control
              [id]="resolvedId()"
              [name]="name() ?? null"
              [type]="isSelectInput() || isDateInput() ? 'text' : type()"
              [readOnly]="isSelectInput()"
              [value]="displayValue()"
              [class]="classNames(styles()['input'], inputSpecialClass())"
              [placeholder]="
                isFocused()
                  ? (placeholder() ?? (isDateInput() ? 'YYYY-MM-DD' : ''))
                  : ''
              "
              [disabled]="disabled()"
              [attr.autocomplete]="autoComplete()"
              [attr.inputmode]="isDateInput() ? 'numeric' : null"
              [attr.maxlength]="isDateInput() ? 10 : null"
              [attr.aria-invalid]="hasError()"
              [attr.aria-describedby]="
                hasSupportingText() ? helperTextId() : null
              "
              (input)="handleInput($event)"
              (focus)="handleControlFocus()"
              (blur)="handleControlBlur()"
            />
          }
        </div>

        <div [class]="styles()['activeIndicator']"></div>

        @if (!showErrorIcon()) {
          @if (effectiveTrailingIcon(); as trailing) {
            @if (isDateInput() || isSelectInput()) {
              <button
                #calendarTrigger
                type="button"
                [disabled]="disabled()"
                [attr.aria-label]="
                  isDateInput() ? 'Choose date' : 'Show options'
                "
                [attr.aria-expanded]="
                  isDateInput() ? showDatePicker() : showMenu()
                "
                [class]="classNames(styles()['trailingIcon'], 'cursor-pointer')"
                (click)="handleTrailingClick($event)"
              >
                <span class="flex items-center justify-center w-full h-full">
                  <lib-icon [icon]="trailing" className="h-5" />
                </span>
              </button>
            } @else {
              <div [class]="styles()['trailingIcon']">
                <div class="flex items-center justify-center w-full h-full">
                  <lib-icon [icon]="trailing" className="h-5" />
                </div>
              </div>
            }
          } @else if (suffix()) {
            <span [class]="styles()['suffix']">{{ suffix() }}</span>
          }
        } @else {
          <div
            [class]="
              classNames(styles()['trailingIcon'], {
                ' absolute right-0': !effectiveTrailingIcon(),
              })
            "
          >
            <lib-icon [icon]="errorIcon" className="h-5 text-error" />
          </div>
        }
      </fieldset>

      @if (hasSupportingText()) {
        <p [class]="styles()['supportingText']" [id]="helperTextId()">
          {{ supportingMessage() }}
        </p>
      }

      @if (isDateInput() && showDatePicker()) {
        <lib-anchor-positioner [anchor]="rootElement()!" position="bottom">
          <div
            #datePickerPopup
            class="z-50 shadow-xl rounded-[28px] bg-surface-container-high overflow-hidden"
          >
            <lib-date-picker
              [value]="tempDate()"
              (valueChange)="handleDatePickerChange($event)"
            />
            <div class="flex justify-end gap-2 p-4 pt-0">
              <lib-button
                variant="text"
                size="small"
                label="Cancel"
                (click)="showDatePicker.set(false)"
              />
              <lib-button
                variant="filled"
                size="small"
                label="OK"
                (click)="handleDateConfirm()"
              />
            </div>
          </div>
        </lib-anchor-positioner>
      }

      @if (isSelectInput() && showMenu()) {
        <lib-anchor-positioner [anchor]="rootElement()!" position="bottom">
          <div #menuPopup class="max-w-full" [style.width.px]="rootWidth()">
            <lib-menu
              purpose="selection"
              [accessibleLabel]="label() || 'Options'"
            >
              @for (opt of options(); track opt.value ?? $index) {
                @if (opt.type === 'divider') {
                  <lib-divider class="my-1" />
                } @else if (opt.type === 'headline') {
                  @if (opt.label) {
                    <lib-menu-headline [label]="opt.label" />
                  }
                } @else {
                  <lib-menu-item
                    [label]="opt.label ?? ''"
                    [leadingIcon]="opt.leadingIcon"
                    [trailingIcon]="opt.trailingIcon"
                    [disabled]="opt.disabled ?? false"
                    [selected]="opt.value === resolvedValue()"
                    (click)="handleSelectOption(opt.value)"
                  />
                }
              }
            </lib-menu>
          </div>
        </lib-anchor-positioner>
      }
    </div>
  `,
})
export class TextField implements OnInit {
  readonly label = input.required<string>();
  readonly variant = input<TextFieldInterface['props']['variant']>('filled');
  readonly type =
    input<NonNullable<TextFieldInterface['props']['type']>>('text');
  readonly multiline = input(false, { transform: booleanAttribute });
  readonly value = input<string>();
  readonly defaultValue = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly id = input<string>();
  readonly placeholder = input<string>();
  readonly autoComplete = input('on');
  readonly autoFocus = input(false, { transform: booleanAttribute });
  readonly leadingIcon = input<IconType>();
  readonly trailingIcon = input<IconType>();
  readonly suffix = input<string>();
  readonly supportingText = input<string>();
  readonly errorText = input<string | null>();
  readonly showSupportingText = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  /** Selectable options for `type="select"`. */
  readonly options = input<TextFieldOption[]>([]);
  /**
   * Transforms typed or pasted input into the value, on every keystroke.
   * Defaults to the built-in `YYYY-MM-DD` mask for `type="date"`; unset for
   * every other type. Providing one for `type="date"` replaces the
   * built-in mask.
   *
   * Must be idempotent (`mask(mask(x)) === mask(x)`): the field is
   * controlled, so `mask` receives its own previous output back as `raw` on
   * every subsequent keystroke. A literal you inject (a `+33` country code,
   * a fixed digit group) will be mistaken for freshly typed input on the
   * next call unless you strip it back out first.
   */
  readonly mask = input<(raw: string) => string>();
  readonly className = input<string | ClassNameComponent<TextFieldInterface>>();

  /** Emits an accepted value transition and supports `[(value)]`. */
  readonly valueChange = output<string>();
  /** Fires when the underlying control gains focus. */
  readonly focus = output<void>();
  /** Fires when the underlying control loses focus. */
  readonly blur = output<void>();

  protected readonly classNames = classNames;
  protected readonly errorIcon = iError;

  private readonly generatedId = `text-field-${nextTextFieldId++}`;
  protected readonly resolvedId = computed(() => this.id() || this.generatedId);

  protected readonly helperTextId = computed(
    () => `${this.resolvedId()}-helper`,
  );

  private readonly document = inject(DOCUMENT);

  private readonly valueState = createControllableState<string>({
    value: this.value,
    defaultValue: computed(() => this.defaultValue() ?? ''),
    onChange: (next) => this.valueChange.emit(next),
    componentName: 'TextField',
    stateName: 'value',
  });

  protected readonly resolvedValue = this.valueState.value;

  protected readonly isFocused = signal(false);
  protected readonly showErrorIcon = signal(false);
  protected readonly showDatePicker = signal(false);
  protected readonly tempDate = signal<Date | null>(null);
  protected readonly showMenu = signal(false);

  protected readonly hasError = computed(() => !!this.errorText()?.length);
  protected readonly hasSupportingText = computed(
    () =>
      this.showSupportingText() ??
      (this.hasError() || !!this.supportingText()?.length),
  );
  protected readonly supportingMessage = computed(() => {
    const error = this.errorText();
    if (error?.length) return error;
    const supporting = this.supportingText();
    return supporting?.length ? supporting : ' ';
  });

  protected readonly isDateInput = computed(() => this.type() === 'date');
  protected readonly isSelectInput = computed(() => this.type() === 'select');

  protected readonly displayValue = computed(() => {
    if (this.isSelectInput()) {
      const selected = this.options().find(
        (option) => String(option.value) === this.resolvedValue(),
      );
      return selected ? String(selected.label) : this.resolvedValue();
    }
    return this.resolvedValue();
  });

  protected readonly isFloating = computed(() =>
    resolveTextFieldFloating({
      isFocused: this.isFocused(),
      hasValue: this.displayValue().length > 0,
      type: this.type(),
      isMenuOpen: this.showMenu(),
    }),
  );

  protected readonly effectiveTrailingIcon = computed(() =>
    resolveTextFieldTrailingIcon<IconType>({
      type: this.type(),
      trailingIcon: this.trailingIcon(),
      isMenuOpen: this.showMenu(),
      dateIcon: iCalendarToday,
      menuOpenIcon: iKeyboardArrowUp,
      menuClosedIcon: iKeyboardArrowDown,
    }),
  );

  protected readonly effectiveMask = computed(
    () =>
      this.mask() ??
      (this.isDateInput() ? sanitizeTextFieldDateInput : undefined),
  );

  // Select's value only ever comes from picking an option, never typing.
  protected readonly inputSpecialClass = computed(() =>
    this.isSelectInput() ? 'cursor-pointer selection:bg-transparent' : '',
  );

  protected readonly styles = createStyle(textFieldStyle, () => ({
    label: this.label(),
    variant: this.variant(),
    type: this.type(),
    multiline: this.multiline(),
    value: this.value(),
    defaultValue: this.defaultValue(),
    onChange: undefined,
    disabled: this.disabled(),
    name: this.name(),
    id: this.resolvedId(),
    placeholder: this.placeholder(),
    autoComplete: this.autoComplete(),
    autoFocus: this.autoFocus(),
    onFocus: undefined,
    onBlur: undefined,
    leadingIcon: this.leadingIcon(),
    trailingIcon: this.trailingIcon(),
    suffix: this.suffix(),
    supportingText: this.supportingText(),
    errorText: this.errorText(),
    showSupportingText: this.showSupportingText(),
    options: this.options(),
    mask: this.mask(),
    showErrorIcon: this.showErrorIcon(),
    isFocused: this.isFocused(),
    isFloating: this.isFloating(),
    hasSupportingText: this.hasSupportingText(),
    className: this.className(),
  }));

  protected readonly rootElement =
    viewChild<ElementRef<HTMLElement>>('fieldRoot');
  private readonly legendElement =
    viewChild<ElementRef<HTMLLegendElement>>('legend');
  private readonly control =
    viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('control');
  private readonly calendarTrigger =
    viewChild<ElementRef<HTMLButtonElement>>('calendarTrigger');
  private readonly datePickerPopup =
    viewChild<ElementRef<HTMLElement>>('datePickerPopup');
  private readonly menuPopup = viewChild<ElementRef<HTMLElement>>('menuPopup');

  protected rootWidth(): number | undefined {
    return this.rootElement()?.nativeElement.offsetWidth;
  }

  private labelController?: TextFieldLabelController;
  private isFirstLabelUpdate = true;
  private autosizeController?: TextareaAutosizeController;
  private isFirstFocusEffect = true;

  constructor() {
    effect(() => {
      const error = this.errorText();
      this.showErrorIcon.set(!!error?.length);
    });

    effect(() => {
      if (this.showDatePicker()) {
        this.isFocused.set(true);
      } else if (!this.isSelectInput() || !this.showMenu()) {
        this.isFocused.set(false);
      }
    });

    effect(() => {
      const focused = this.isFocused();
      if (this.isFirstFocusEffect) {
        this.isFirstFocusEffect = false;
        return;
      }
      if (focused) {
        this.showErrorIcon.set(false);
        this.focus.emit();
      } else {
        if (this.errorText()?.length) this.showErrorIcon.set(true);
        this.blur.emit();
      }
    });

    afterRenderEffect((onCleanup) => {
      const shouldFocus =
        this.autoFocus() && !this.disabled() && this.type() !== 'select';
      if (!shouldFocus) return;
      const rafId = this.document.defaultView?.requestAnimationFrame(() => {
        const el = this.control()?.nativeElement;
        if (el && !this.isFocused() && !this.disabled())
          el.focus({ preventScroll: true });
      });
      onCleanup(() => {
        if (rafId !== undefined)
          this.document.defaultView?.cancelAnimationFrame(rafId);
      });
    });

    afterRenderEffect((onCleanup) => {
      // Scoped to the legend alone -- see the `root` doc on
      // `createTextFieldLabelController` for why a wider root (e.g. the
      // fieldset) would fight that element's own unrelated CSS transitions.
      const root = this.legendElement()?.nativeElement;
      if (!root) return;
      this.isFirstLabelUpdate = true;
      const controller = createTextFieldLabelController({ root });
      this.labelController = controller;
      onCleanup(() => {
        controller.destroy();
        if (this.labelController === controller)
          this.labelController = undefined;
      });
    });

    afterRenderEffect(() => {
      this.isFloating();
      this.variant();
      if (this.isFirstLabelUpdate) {
        this.isFirstLabelUpdate = false;
        return;
      }
      this.labelController?.update();
    });

    afterRenderEffect((onCleanup) => {
      if (!this.multiline()) return;
      const textarea = this.control()?.nativeElement as
        | HTMLTextAreaElement
        | undefined;
      if (!textarea) return;
      const controller = createTextareaAutosizeController({ textarea });
      this.autosizeController = controller;
      onCleanup(() => {
        controller.destroy();
        if (this.autosizeController === controller)
          this.autosizeController = undefined;
      });
    });

    afterRenderEffect(() => {
      this.displayValue();
      this.autosizeController?.update();
    });

    afterRenderEffect((onCleanup) => {
      if (!this.showDatePicker()) return;

      const isInside = (target: Node | null): boolean => {
        if (!target) return false;
        return (
          !!this.rootElement()?.nativeElement.contains(target) ||
          !!this.datePickerPopup()?.nativeElement.contains(target)
        );
      };

      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (this.datePickerPopup()?.nativeElement.contains(target)) return;
        if (this.calendarTrigger()?.nativeElement.contains(target)) return;
        this.showDatePicker.set(false);
      };

      const handleFocusIn = (event: FocusEvent) => {
        if (!isInside(event.target as Node)) this.showDatePicker.set(false);
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') this.showDatePicker.set(false);
      };

      this.document.addEventListener('pointerdown', handlePointerDown);
      this.document.addEventListener('focusin', handleFocusIn);
      this.document.addEventListener('keydown', handleKeyDown);

      onCleanup(() => {
        this.document.removeEventListener('pointerdown', handlePointerDown);
        this.document.removeEventListener('focusin', handleFocusIn);
        this.document.removeEventListener('keydown', handleKeyDown);
      });
    });

    afterRenderEffect((onCleanup) => {
      if (!this.showMenu()) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          this.rootElement()?.nativeElement.contains(target) ||
          this.menuPopup()?.nativeElement.contains(target)
        ) {
          return;
        }
        this.showMenu.set(false);
        this.isFocused.set(false);
      };

      this.document.addEventListener('mousedown', handleClickOutside);
      onCleanup(() =>
        this.document.removeEventListener('mousedown', handleClickOutside),
      );
    });
  }

  ngOnInit(): void {
    this.valueState.initialize();
  }

  protected handleFieldClick(): void {
    if (this.isSelectInput()) {
      this.handleSelectToggle();
      return;
    }
    const el = this.control()?.nativeElement;
    if (el && !this.isFocused() && !this.disabled())
      el.focus({ preventScroll: true });
  }

  protected handleControlFocus(): void {
    if (!this.isSelectInput()) this.isFocused.set(true);
  }

  protected handleControlBlur(): void {
    if (!this.isSelectInput()) this.isFocused.set(false);
  }

  protected handleInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const mask = this.effectiveMask();
    const newValue = mask ? mask(target.value) : target.value;
    this.valueState.set(newValue);
    this.showErrorIcon.set(false);
    // A controlled field whose owner rejects (or rewrites) the keystroke
    // resolves back to the same displayValue() the DOM already diverged
    // from; unlike React, Angular's `[value]` binding only writes when the
    // bound expression's result changes, so an unchanged resolved value
    // would otherwise leave the native element holding the rejected
    // keystroke. Reconcile it here, synchronously, every keystroke.
    const resolved = this.displayValue();
    if (target.value !== resolved) target.value = resolved;
  }

  protected handleTrailingClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isDateInput()) this.handleDatePickerToggle();
    if (this.isSelectInput()) this.handleSelectToggle();
  }

  protected handleDatePickerToggle(): void {
    if (this.disabled()) return;
    if (this.showDatePicker()) {
      this.showDatePicker.set(false);
      return;
    }
    this.tempDate.set(parseTextFieldIsoDate(this.resolvedValue()));
    this.showDatePicker.set(true);
  }

  protected handleDatePickerChange(value: DatePickerValue): void {
    this.tempDate.set(value instanceof Date ? value : null);
  }

  protected handleDateConfirm(): void {
    this.valueState.set(formatTextFieldIsoDate(this.tempDate()));
    this.showDatePicker.set(false);
  }

  protected handleSelectToggle(): void {
    if (this.disabled()) return;
    const next = !this.showMenu();
    this.showMenu.set(next);
    this.isFocused.set(next);
  }

  protected handleSelectOption(value: string | number): void {
    this.valueState.set(String(value));
    this.showMenu.set(false);
    this.isFocused.set(false);
  }
}
