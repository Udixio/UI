import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  output,
  viewChild,
  type OnInit,
} from '@angular/core';
import {
  getSwitchChangeTransition,
  getSwitchHandleOffset,
  switchStyle,
  type ClassNameComponent,
  type Icon as IconType,
  type SwitchInterface,
} from '@udixio/core';
import {
  createSwitchThumbController,
  type SwitchThumbController,
} from '@udixio/core/dom';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

/**
 * Switches toggle the selection of a single item on or off.
 *
 * @status beta
 * @category Input
 * @devx
 * - `checked` is controlled; `defaultChecked` initializes uncontrolled use.
 * - `checkedChange` emits one accepted transition and supports `[(checked)]`.
 * - The thumb slide is driven by a shared `@udixio/core/dom` Anime.js tween controller, the same one the React
 *   adapter uses -- an accepted exception to the rest of `@udixio/core/dom`, which uses Motion.
 * @a11y
 * - Renders `role="switch"` with `aria-checked` and standard Space/Enter activation.
 * @limitations
 * - The component does not render a visible label; provide one with `aria-label` or `aria-labelledby`.
 */
@Component({
  selector: 'lib-switch',
  standalone: true,
  imports: [Icon, StateLayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div
      role="switch"
      [class]="styles()['switch']"
      [attr.aria-checked]="isChecked()"
      [attr.aria-disabled]="disabled() || null"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-labelledby]="ariaLabelledBy()"
      [attr.tabindex]="disabled() ? -1 : 0"
      (click)="handleToggle()"
      (keydown)="handleKeyDown($event)"
    >
      <div
        #handleContainer
        [class]="styles()['handleContainer']"
        [style.translate.px]="handleOffset()"
      >
        <lib-state-layer
          [className]="styles()['stateLayer']"
          [colorName]="isChecked() ? 'primary' : 'on-surface'"
          stateClassName="state-ripple-group-[switch]"
        />
        <div [class]="styles()['handle']">
          @if (resolvedIcon()) {
            <lib-icon [icon]="resolvedIcon()!" [className]="styles()['icon']" />
          }
        </div>
      </div>
    </div>
  `,
})
export class Switch implements OnInit {
  readonly checked = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly defaultChecked = input(false, { transform: booleanAttribute });
  readonly activeIcon = input<IconType>();
  readonly inactiveIcon = input<IconType>();
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible-name override when no visible label is available. */
  readonly ariaLabel = input<string | undefined>(undefined, {
    alias: 'aria-label',
  });
  /** Id reference for text that labels this switch. */
  readonly ariaLabelledBy = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });
  readonly className = input<string | ClassNameComponent<SwitchInterface>>();

  /** Emits an accepted checked-state request and supports `[(checked)]`. */
  readonly checkedChange = output<boolean>();

  private readonly checkedState = createControllableState({
    value: this.checked,
    defaultValue: this.defaultChecked,
    onChange: (checked) => this.checkedChange.emit(checked),
    componentName: 'Switch',
    stateName: 'checked',
  });

  protected readonly isChecked = this.checkedState.value;
  protected readonly resolvedIcon = computed(() =>
    this.isChecked() ? this.activeIcon() : this.inactiveIcon(),
  );
  protected readonly handleOffset = computed(() =>
    getSwitchHandleOffset(this.isChecked()),
  );
  protected readonly styles = createStyle(switchStyle, () => ({
    checked: this.checked(),
    defaultChecked: this.defaultChecked(),
    activeIcon: this.activeIcon(),
    inactiveIcon: this.inactiveIcon(),
    disabled: this.disabled(),
    isChecked: this.isChecked(),
    className: this.className(),
  }));

  private readonly handleContainer =
    viewChild.required<ElementRef<HTMLElement>>('handleContainer');
  private controller?: SwitchThumbController;
  private isFirstUpdate = true;

  constructor() {
    afterRenderEffect((onCleanup) => {
      const root = this.handleContainer().nativeElement;
      this.isFirstUpdate = true;
      const controller = createSwitchThumbController({ root });
      this.controller = controller;

      onCleanup(() => {
        controller.destroy();
        if (this.controller === controller) {
          this.controller = undefined;
        }
      });
    });

    afterRenderEffect(() => {
      const isChecked = this.isChecked();
      // This effect also fires once on the initial render -- animating then
      // would slide the handle in from the *other* resting offset, as if it
      // had just been toggled, even though it rendered at the right spot
      // the whole time. Only real `isChecked` transitions after mount
      // should ever animate.
      if (this.isFirstUpdate) {
        this.isFirstUpdate = false;
        return;
      }
      this.controller?.update(
        getSwitchHandleOffset(!isChecked),
        getSwitchHandleOffset(isChecked),
      );
    });
  }

  ngOnInit(): void {
    this.checkedState.initialize();
  }

  protected handleToggle(): void {
    const transition = getSwitchChangeTransition({
      disabled: this.disabled(),
      isChecked: this.isChecked(),
    });
    if (!transition.blocked) this.checkedState.set(transition.nextChecked);
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.handleToggle();
    }
  }
}
