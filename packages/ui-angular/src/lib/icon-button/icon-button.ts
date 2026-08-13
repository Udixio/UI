import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
  viewChild,
  ElementRef,
  type OnInit,
} from '@angular/core';
import {
  getIconButtonPressTransition,
  getIconButtonShapeTransition,
  getIconButtonStateColor,
  iconButtonStyle,
  type ClassNameComponent,
  type IconButtonInterface,
  type IconButtonProps,
  type TooltipProps,
} from '@udixio/core';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { Tooltip } from '../tooltip/tooltip';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

/**
 * Icon buttons expose a frequent action through one unambiguous icon.
 *
 * @status stable
 * @category Action
 * @devx
 * - Requires the `label` and `icon` inputs.
 * - Shows `label` in a tooltip by default; `tooltip` overrides or disables it.
 * - `pressed` is controlled; `defaultPressed` initializes uncontrolled usage.
 * - `toggleable` enables `aria-pressed` and the `pressedChange` output.
 * @a11y
 * - Uses native button/link semantics, a stable accessible name, a 48px target, and visible focus.
 * @limitations
 * - Disabled links are inert and removed from the tab order.
 * - Navigation links ignore toggle state; use `aria-current` for the current destination.
 */
@Component({
  selector: 'udx-icon-button',
  standalone: true,
  imports: [NgTemplateOutlet, Icon, StateLayer, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <ng-template #content>
      <span [class]="styles()['touchTarget']"></span>
      <udx-state-layer
        [className]="styles()['stateLayer']"
        [colorName]="stateColor()"
        [shapeTransition]="shapeTransition()"
        stateClassName="state-ripple-group-[icon-button]"
      />
      <udx-icon [icon]="resolvedIcon()" [className]="styles()['icon']" />
    </ng-template>

    @if (href() !== undefined) {
      <a
        #interactiveElement
        [hidden]="!hasAccessibleLabel()"
        [class]="styles()['iconButton']"
        [attr.href]="disabled() ? null : href()"
        [attr.aria-label]="label()"
        [attr.aria-disabled]="disabled() || !hasAccessibleLabel() || null"
        [attr.aria-hidden]="!hasAccessibleLabel() || null"
        [attr.aria-current]="ariaCurrent()"
        [attr.tabindex]="disabled() || !hasAccessibleLabel() ? -1 : tabIndex()"
        [attr.target]="target()"
        [attr.rel]="rel()"
        [attr.role]="disabled() || !hasAccessibleLabel() ? 'link' : null"
        (click)="handleClick($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <button
        #interactiveElement
        [hidden]="!hasAccessibleLabel()"
        [class]="styles()['iconButton']"
        [attr.type]="type()"
        [disabled]="disabled() || !hasAccessibleLabel()"
        [attr.aria-hidden]="!hasAccessibleLabel() || null"
        [attr.aria-label]="label()"
        [attr.aria-pressed]="isToggleButton() ? isPressed() : null"
        [attr.tabindex]="tabIndex()"
        (click)="handleClick($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }

    @if (tooltipText(); as text) {
      @if (interactiveElement(); as target) {
        <udx-tooltip
          [target]="target"
          [text]="text"
          [trigger]="disabled() ? null : tooltipTriggers"
          [describeTarget]="text !== label()"
        />
      }
    }
  `,
})
export class IconButton implements OnInit {
  readonly label = input.required<string>();
  readonly icon = input.required<IconButtonProps['icon']>();
  /** Visual tooltip text. Defaults to `label`; set to `false` to hide it. */
  readonly tooltip = input<IconButtonProps['tooltip']>();
  readonly pressedIcon = input<IconButtonProps['pressedIcon']>();
  readonly variant = input<IconButtonProps['variant']>('standard');
  readonly size = input<IconButtonProps['size']>('medium');
  readonly width = input<IconButtonProps['width']>('default');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly shape = input<IconButtonProps['shape']>('rounded');
  readonly shapeFeedback =
    input<NonNullable<IconButtonProps['shapeFeedback']>>('morph');
  readonly transition = input<IconButtonProps['transition']>();
  readonly toggleable = input(false, { transform: booleanAttribute });
  readonly pressed = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly defaultPressed = input(false, { transform: booleanAttribute });
  /** Classes or state-aware element classes applied through the shared style contract. */
  readonly className = input<
    string | ClassNameComponent<IconButtonInterface>
  >();
  /** Navigation destination; switches the inner element to a native link. */
  readonly href = input<string>();
  /** Native link browsing-context target. */
  readonly target = input<string>();
  /** Native link relationship tokens. */
  readonly rel = input<string>();
  /** Tab order override applied to the inner interactive element. */
  readonly tabIndex = input<number>();
  /** Optional legacy tooltip text; `tooltip` takes precedence. */
  readonly title = input<string>();
  /** Native action button type. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  /** Current-item state for navigation links. */
  readonly ariaCurrent = input<
    boolean | 'page' | 'step' | 'location' | 'date' | 'time' | undefined
  >(undefined, { alias: 'aria-current' });

  /** Emits an accepted pressed-state request and supports `[(pressed)]`. */
  readonly pressedChange = output<boolean>();

  protected readonly interactiveElement =
    viewChild<ElementRef<HTMLButtonElement | HTMLAnchorElement>>(
      'interactiveElement',
    );
  protected readonly tooltipTriggers: NonNullable<TooltipProps['trigger']> = [
    'hover',
    'focus',
  ];

  private readonly pressedState = createControllableState({
    value: this.pressed,
    defaultValue: this.defaultPressed,
    onChange: (pressed) => this.pressedChange.emit(pressed),
    componentName: 'IconButton',
    stateName: 'pressed',
  });

  protected readonly isToggleButton = computed(
    () => this.toggleable() && this.href() === undefined,
  );
  protected readonly hasAccessibleLabel = computed(
    () => this.label().trim() !== '',
  );
  protected readonly tooltipText = computed(() =>
    this.tooltip() === false
      ? undefined
      : (this.tooltip() ?? this.title() ?? this.label()),
  );
  protected readonly isPressed = computed(
    () => this.isToggleButton() && this.pressedState.value(),
  );
  protected readonly resolvedIcon = computed(
    () => (this.isPressed() && this.pressedIcon()) || this.icon(),
  );
  protected readonly stateColor = computed(() =>
    getIconButtonStateColor({
      variant: this.variant(),
      toggleable: this.isToggleButton(),
      isPressed: this.isPressed(),
    }),
  );
  protected readonly shapeTransition = computed(() =>
    getIconButtonShapeTransition({
      size: this.size(),
      shape: this.shape(),
      shapeFeedback: this.shapeFeedback(),
      isPressed: this.isPressed(),
      disabled: this.disabled() || !this.hasAccessibleLabel(),
      transition: this.transition(),
    }),
  );
  protected readonly styles = createStyle(iconButtonStyle, () => ({
    label: this.label(),
    icon: this.icon(),
    tooltip: this.tooltip(),
    pressedIcon: this.pressedIcon(),
    variant: this.variant(),
    size: this.size(),
    width: this.width(),
    disabled: this.disabled(),
    shape: this.shape(),
    shapeFeedback: this.shapeFeedback(),
    transition: this.transition(),
    toggleable: this.isToggleButton(),
    pressed: this.pressed(),
    defaultPressed: this.defaultPressed(),
    isPressed: this.isPressed(),
    className: this.className(),
  }));

  ngOnInit(): void {
    this.pressedState.initialize();
  }

  protected handleClick(event: Event): void {
    const interaction = getIconButtonPressTransition({
      disabled: this.disabled(),
      toggleable: this.isToggleButton(),
      isPressed: this.isPressed(),
    });

    if (interaction.blocked || !this.hasAccessibleLabel()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (interaction.nextPressed !== undefined) {
      this.pressedState.set(interaction.nextPressed);
    }
  }
}
