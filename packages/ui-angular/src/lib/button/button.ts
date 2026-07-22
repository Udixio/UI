import {
  ChangeDetectionStrategy,
  Component,
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
  type ButtonProps,
  type ClassNameComponent,
  type ButtonInterface,
} from '@udixio/core';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { ButtonLoadingIndicator } from './button-loading-indicator';

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
  template: `
    <ng-template #content>
      @if (iconPosition() === 'left' && icon(); as leadingIcon) {
        <lib-icon [icon]="leadingIcon" [className]="styles()['icon']" />
      }
      @if (loading()) {
        <span
          class="!absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <lib-button-loading-indicator [color]="progressColor()" />
        </span>
      }
      <span [class]="styles()['label']">{{ label() }}</span>
      @if (iconPosition() === 'right' && icon(); as trailingIcon) {
        <lib-icon [icon]="trailingIcon" [className]="styles()['icon']" />
      }
    </ng-template>

    @if (href() !== undefined) {
      <a
        [class]="styles()['button']"
        [attr.href]="interactionBlocked() ? null : href()"
        [attr.aria-disabled]="interactionBlocked() || null"
        [attr.aria-pressed]="toggleable() ? isPressed() : null"
        [attr.aria-busy]="loading() || null"
        [attr.tabindex]="interactionBlocked() ? -1 : null"
        [attr.role]="interactionBlocked() ? 'link' : null"
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
        [attr.aria-pressed]="toggleable() ? isPressed() : null"
        [attr.aria-busy]="loading() || null"
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
  readonly iconPosition = input<ButtonProps['iconPosition']>('left');
  readonly disabled = input<boolean>(false);
  readonly disableTextMargins = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly shape = input<ButtonProps['shape']>('rounded');
  readonly allowShapeTransformation = input<boolean>(true);
  readonly transition = input<ButtonProps['transition']>();
  readonly toggleable = input<boolean>(false);
  readonly pressed = input<boolean>();
  readonly defaultPressed = input<boolean>(false);
  readonly label = input<string>('');
  readonly className = input<string | ClassNameComponent<ButtonInterface>>();
  readonly href = input<string>();

  readonly pressedChange = output<boolean>();

  private readonly pressedState = createControllableState({
    value: this.pressed,
    defaultValue: this.defaultPressed,
    onChange: (pressed) => this.pressedChange.emit(pressed),
  });

  protected readonly isPressed = this.pressedState.value;
  protected readonly stateColor = computed(() =>
    getButtonStateColor({
      variant: this.variant(),
      toggleable: this.toggleable(),
      isPressed: this.toggleable() && this.isPressed(),
    }),
  );
  protected readonly progressColor = computed(() =>
    getButtonProgressColor({
      variant: this.variant(),
      disabled: this.disabled(),
    }),
  );
  protected readonly shapeTransition = computed(() =>
    getButtonShapeTransition({
      size: this.size(),
      shape: this.shape(),
      allowShapeTransformation: this.allowShapeTransformation(),
      isPressed: this.toggleable() && this.isPressed(),
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
    toggleable: this.toggleable(),
    pressed: this.pressed(),
    defaultPressed: this.defaultPressed(),
    label: this.label(),
    isPressed: this.toggleable() && this.isPressed(),
    className: this.className(),
  }));

  ngOnInit(): void {
    this.pressedState.initialize();
  }

  protected interactionBlocked(): boolean {
    return this.disabled() || this.loading();
  }

  protected handleClick(event: Event): void {
    const interaction = getButtonPressTransition({
      disabled: this.disabled(),
      loading: this.loading(),
      toggleable: this.toggleable(),
      isPressed: this.toggleable() && this.isPressed(),
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
