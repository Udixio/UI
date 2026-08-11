import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
  type OnInit,
  viewChild,
} from '@angular/core';
import {
  checkboxStyle,
  getCheckboxChangeTransition,
  type CheckboxInterface,
  type ClassNameComponent,
} from '@udixio/core';
import { iCheck } from '@udixio/icons-rounded-400/check';
import { iRemove } from '@udixio/icons-rounded-400/remove';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';

let nextCheckboxId = 0;

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

/**
 * Checkboxes let people select one or more independent options.
 *
 * @status beta
 * @category Selection
 * @devx
 * - `checked` is controlled; `defaultChecked` initializes uncontrolled use.
 * - `checkedChange` emits one accepted transition and supports `[(checked)]`.
 * @a11y
 * - Renders a native checkbox with standard keyboard and form behavior.
 * - `invalid` sets `aria-invalid`; use `aria-describedby` for an error explanation.
 * @limitations
 * - Associate a visible `<label for>` or provide `aria-label`; this component does not render label text.
 */
@Component({
  selector: 'udx-checkbox',
  standalone: true,
  imports: [Icon, StateLayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div [class]="styles()['checkbox']">
      <udx-state-layer
        [className]="styles()['stateLayer']"
        [colorName]="stateColor()"
        stateClassName="state-ripple-group-[checkbox]"
      />
      <input
        #inputElement
        [class]="styles()['input']"
        type="checkbox"
        [id]="resolvedId()"
        [name]="name()"
        [value]="value()"
        [checked]="isChecked()"
        [disabled]="disabled()"
        [required]="required()"
        [indeterminate]="indeterminate()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-describedby]="ariaDescribedBy()"
        [attr.aria-invalid]="invalid() || null"
        (change)="handleChange()"
        (focus)="isFocused.set(true)"
        (blur)="isFocused.set(false)"
      />
      <span aria-hidden="true" [class]="styles()['box']"></span>
      @if (isChecked() || indeterminate()) {
        <udx-icon
          aria-hidden="true"
          [icon]="indeterminate() ? minusIcon : checkIcon"
          [className]="styles()['icon']"
        />
      }
    </div>
  `,
})
export class Checkbox implements OnInit {
  readonly checked = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly defaultChecked = input(false, { transform: booleanAttribute });
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly id = input<string>();
  readonly value = input<string>();
  /** Requires the checkbox to be selected before its form can submit. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Accessible-name override when no visible label is available. */
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  /** Id reference for text that describes validation or usage. */
  readonly ariaDescribedBy = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });
  readonly className = input<string | ClassNameComponent<CheckboxInterface>>();

  readonly checkedChange = output<boolean>();

  protected readonly checkIcon = iCheck;
  protected readonly minusIcon = iRemove;

  private readonly fallbackId = `checkbox-${nextCheckboxId++}`;
  private readonly inputElement =
    viewChild.required<ElementRef<HTMLInputElement>>('inputElement');
  private readonly checkedState = createControllableState({
    value: this.checked,
    defaultValue: this.defaultChecked,
    onChange: (checked) => this.checkedChange.emit(checked),
    componentName: 'Checkbox',
    stateName: 'checked',
  });

  protected readonly isChecked = this.checkedState.value;
  protected readonly isFocused = signal(false);
  protected readonly resolvedId = computed(() => this.id() ?? this.fallbackId);
  protected readonly stateColor = computed(() =>
    this.isChecked() || this.indeterminate() ? 'primary' : 'on-surface',
  );
  protected readonly styles = createStyle(checkboxStyle, () => ({
    checked: this.checked(),
    defaultChecked: this.defaultChecked(),
    indeterminate: this.indeterminate(),
    disabled: this.disabled(),
    invalid: this.invalid(),
    id: this.resolvedId(),
    name: this.name(),
    value: this.value(),
    required: this.required(),
    isChecked: this.isChecked(),
    isFocused: this.isFocused(),
    className: this.className(),
  }));

  ngOnInit(): void {
    this.checkedState.initialize();
  }

  protected handleChange(): void {
    const transition = getCheckboxChangeTransition({
      disabled: this.disabled(),
      isChecked: this.isChecked(),
    });
    if (!transition.blocked) this.checkedState.set(transition.nextChecked);

    const input = this.inputElement().nativeElement;
    input.checked = this.isChecked();
    input.indeterminate = this.indeterminate();
  }
}
