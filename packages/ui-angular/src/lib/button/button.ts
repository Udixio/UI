import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
  signal,
  type OnInit,
  viewChild,
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
 * Buttons prompt most actions in a UI.
 *
 * @status beta
 * @category Action
 * @devx
 * - Requires the `label` input or projected content for visible text and accessibility.
 * - `pressed` is controlled; `defaultPressed` initializes uncontrolled usage.
 * - `toggleable` enables `aria-pressed` and the `pressedChange` output on action buttons.
 * - `type` defaults to `'button'` to prevent accidental form submissions.
 * @a11y
 * - Uses native button/link semantics and preserves its accessible name while loading.
 * - Provides a 48px touch target and a visible `:focus-visible` outline.
 * @limitations
 * - When `href` is set with `disabled`, the link is made inert with `aria-disabled` and removed from the tab order.
 * - Navigation links ignore toggle state; use `aria-current` for the current destination.
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
      <span #labelContent [class]="styles()['label']">
        <ng-content>{{ label() }}</ng-content>
      </span>
      @if (resolvedIconPosition() === 'end' && icon(); as trailingIcon) {
        <lib-icon [icon]="trailingIcon" [className]="styles()['icon']" />
      }
    </ng-template>

    @if (href() !== undefined) {
      <a
        [hidden]="!hasVisibleLabel()"
        [class]="styles()['button']"
        [attr.href]="interactionBlocked() ? null : href()"
        [attr.aria-disabled]="interactionBlocked() || null"
        [attr.aria-hidden]="!hasVisibleLabel() || null"
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
        [hidden]="!hasVisibleLabel()"
        [class]="styles()['button']"
        [attr.type]="type()"
        [disabled]="interactionBlocked()"
        [attr.aria-hidden]="!hasVisibleLabel() || null"
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

  /** Visible text fallback when no content is projected. */
  readonly label = input<string>('');

  /** Classes or state-aware element classes applied through the shared style contract. */
  readonly className = input<string | ClassNameComponent<ButtonInterface>>();

  /** Navigation URL. When defined, the component renders a native link. */
  readonly href = input<string>();

  /** Native link browsing-context target. */
  readonly target = input<string>();

  /** Native link relationship tokens. */
  readonly rel = input<string>();

  /** Tab order override applied to the inner interactive element. */
  readonly tabIndex = input<number>();

  /** Accessible-name override for projected or icon-only content. */
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });

  /** Id reference for elements that describe the button. */
  readonly ariaDescribedBy = input<string | undefined>(undefined, {
    alias: 'aria-describedby',
  });

  /** Current-item state for navigation links. */
  readonly ariaCurrent = input<
    boolean | 'page' | 'step' | 'location' | 'date' | 'time' | undefined
  >(undefined, { alias: 'aria-current' });

  /** Emits a requested pressed-state transition and supports `[(pressed)]`. */
  readonly pressedChange = output<boolean>();

  private readonly labelContent =
    viewChild<ElementRef<HTMLElement>>('labelContent');
  private readonly hasProjectedContent = signal(false);

  constructor() {
    effect((onCleanup) => {
      const labelContent = this.labelContent()?.nativeElement;
      if (!labelContent) {
        this.hasProjectedContent.set(false);
        return;
      }

      const updateProjectedContent = () => {
        this.hasProjectedContent.set(
          Array.from(labelContent.childNodes).some(
            (node) =>
              node.nodeType === 1 ||
              (node.nodeType === 3 && (node.textContent ?? '').trim() !== ''),
          ),
        );
      };
      updateProjectedContent();

      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(updateProjectedContent);
        observer.observe(labelContent, {
          childList: true,
          characterData: true,
          subtree: true,
        });
        onCleanup(() => observer.disconnect());
      }
    });
  }

  private readonly pressedState = createControllableState({
    value: this.pressed,
    defaultValue: this.defaultPressed,
    onChange: (pressed) => this.pressedChange.emit(pressed),
    componentName: 'Button',
    stateName: 'pressed',
  });

  protected readonly isPressed = this.pressedState.value;
  protected readonly hasVisibleLabel = computed(
    () => this.label() !== '' || this.hasProjectedContent(),
  );
  protected readonly resolvedIconPosition = computed(() =>
    resolveButtonIconPosition(this.iconPosition()),
  );
  protected readonly isToggleButton = computed(
    () => this.toggleable() && this.href() === undefined,
  );
  protected readonly interactionBlocked = computed(
    () => this.disabled() || this.loading() || !this.hasVisibleLabel(),
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
