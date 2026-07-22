import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  type OnInit,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  buttonStyle,
  getButtonProgressColor,
  getButtonPressTransition,
  getButtonShapeTransition,
  getButtonStateColor,
  resolveButtonIconPosition,
  type ButtonProps,
  type ClassNameComponent,
  type ButtonInterface,
} from '@udixio/core';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { ButtonLoadingIndicator } from './button-loading-indicator';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

/**
 * Button Angular consuming the same style and interaction contracts as React.
 * `pressed` is controlled, while `defaultPressed` initializes local state.
 * The `pressed`/`pressedChange` pair also supports Angular two-way binding.
 */
@Component({
  selector: 'lib-button',
  standalone: true,
  imports: [NgTemplateOutlet, Icon, StateLayer, ButtonLoadingIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <ng-template #content>
      @if (resolvedIconPosition() === 'start' && icon(); as leadingIcon) {
        <lib-icon [icon]="leadingIcon" [className]="styles()['icon']" />
      }
      @if (loading()) {
        <span
          aria-hidden="true"
          class="!absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <lib-button-loading-indicator [color]="progressColor()" />
        </span>
      }
      <span [class]="styles()['label']">
        <ng-content>{{ label() }}</ng-content>
      </span>
      @if (resolvedIconPosition() === 'end' && icon(); as trailingIcon) {
        <lib-icon [icon]="trailingIcon" [className]="styles()['icon']" />
      }
    </ng-template>

    @if (href() !== undefined) {
      <a
        [class]="styles()['button']"
        [attr.href]="interactionBlocked() ? null : href()"
        [attr.aria-disabled]="interactionBlocked() || null"
        [attr.aria-pressed]="isToggleButton() ? isPressed() : null"
        [attr.aria-busy]="loading() || null"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-describedby]="ariaDescribedBy()"
        [attr.aria-current]="ariaCurrent()"
        [attr.tabindex]="interactionBlocked() ? -1 : tabIndex()"
        [attr.role]="interactionBlocked() ? 'link' : null"
        [attr.target]="target()"
        [attr.rel]="rel()"
        (click)="handleClick($event)"
      >
        <span [class]="styles()['touchTarget']"></span>
        <lib-state-layer
          [className]="styles()['stateLayer']"
          [colorName]="stateColor()"
          [shapeTransition]="shapeTransition()"
          stateClassName="state-ripple-group-[button]"
        />
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <button
        [class]="styles()['button']"
        [attr.type]="type()"
        [disabled]="interactionBlocked()"
        [attr.aria-pressed]="isToggleButton() ? isPressed() : null"
        [attr.aria-busy]="loading() || null"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-describedby]="ariaDescribedBy()"
        [attr.tabindex]="tabIndex()"
        (click)="handleClick($event)"
      >
        <span [class]="styles()['touchTarget']"></span>
        <lib-state-layer
          [className]="styles()['stateLayer']"
          [colorName]="stateColor()"
          [shapeTransition]="shapeTransition()"
          stateClassName="state-ripple-group-[button]"
        />
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }
  `,
})
export class Button implements OnInit {
  readonly type = input<NonNullable<ButtonProps['type']>>('button');
  readonly variant = input<ButtonProps['variant']>('filled');
  readonly size = input<ButtonProps['size']>('medium');
  readonly icon = input<ButtonProps['icon']>();
  readonly iconPosition = input<ButtonProps['iconPosition']>('start');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly disableTextMargins = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly shape = input<ButtonProps['shape']>('rounded');
  readonly allowShapeTransformation = input(true, {
    transform: booleanAttribute,
  });
  readonly transition = input<ButtonProps['transition']>();
  readonly toggleable = input(false, { transform: booleanAttribute });
  readonly pressed = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly defaultPressed = input(false, { transform: booleanAttribute });
  readonly label = input<string>('');
  readonly className = input<string | ClassNameComponent<ButtonInterface>>();
  readonly href = input<string>();
  readonly target = input<string>();
  readonly rel = input<string>();
  readonly tabIndex = input<number>();
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  readonly ariaDescribedBy = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });
  readonly ariaCurrent = input<
    boolean | 'page' | 'step' | 'location' | 'date' | 'time' | undefined
  >(undefined, { alias: 'aria-current' });

  readonly pressedChange = output<boolean>();

  private readonly pressedState = createControllableState({
    value: this.pressed,
    defaultValue: this.defaultPressed,
    onChange: (pressed) => this.pressedChange.emit(pressed),
    componentName: 'Button',
    stateName: 'pressed',
  });

  protected readonly isPressed = this.pressedState.value;
  protected readonly resolvedIconPosition = computed(() =>
    resolveButtonIconPosition(this.iconPosition()),
  );
  protected readonly isToggleButton = computed(
    () => this.toggleable() && this.href() === undefined,
  );
  protected readonly interactionBlocked = computed(
    () => this.disabled() || this.loading(),
  );
  protected readonly stateColor = computed(() =>
    getButtonStateColor({
      variant: this.variant(),
      toggleable: this.isToggleButton(),
      isPressed: this.isToggleButton() && this.isPressed(),
    }),
  );
  protected readonly progressColor = computed(() =>
    getButtonProgressColor({
      variant: this.variant(),
      disabled: this.disabled(),
      toggleable: this.isToggleButton(),
      isPressed: this.isToggleButton() && this.isPressed(),
    }),
  );
  protected readonly shapeTransition = computed(() =>
    getButtonShapeTransition({
      size: this.size(),
      shape: this.shape(),
      allowShapeTransformation: this.allowShapeTransformation(),
      isPressed: this.isToggleButton() && this.isPressed(),
      disabled: this.disabled() || this.loading(),
      transition: this.transition(),
    }),
  );

  protected readonly styles = createStyle(buttonStyle, () => ({
    type: this.type(),
    variant: this.variant(),
    size: this.size(),
    icon: this.icon(),
    iconPosition: this.iconPosition(),
    disabled: this.disabled(),
    disableTextMargins: this.disableTextMargins(),
    loading: this.loading(),
    shape: this.shape(),
    allowShapeTransformation: this.allowShapeTransformation(),
    transition: this.transition(),
    toggleable: this.isToggleButton(),
    pressed: this.pressed(),
    defaultPressed: this.defaultPressed(),
    label: this.label(),
    isPressed: this.isToggleButton() && this.isPressed(),
    className: this.className(),
  }));

  ngOnInit(): void {
    this.pressedState.initialize();
  }

  protected handleClick(event: Event): void {
    const interaction = getButtonPressTransition({
      disabled: this.disabled(),
      loading: this.loading(),
      toggleable: this.isToggleButton(),
      isPressed: this.isToggleButton() && this.isPressed(),
    });

    if (interaction.blocked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (interaction.nextPressed === undefined) {
      return;
    }

    this.pressedState.set(interaction.nextPressed);
  }
}
