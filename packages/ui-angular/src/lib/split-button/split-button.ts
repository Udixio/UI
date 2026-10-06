import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  type OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  type ClassNameComponent,
  type ElementClasses,
  getButtonStateColor,
  getSplitButtonMenuVariant,
  getSplitButtonOpenTransition,
  isSplitButtonValid,
  type MenuInitialFocus,
  mergeClassNames,
  type SplitButtonAction,
  type SplitButtonInterface,
  type SplitButtonProps,
  splitButtonStyle,
} from '@udixio/core';
import {
  createSplitButtonController,
  type SplitButtonController,
  type SplitButtonDismissReason,
} from '@udixio/core/dom';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import { Button } from '../button/button';
import { IconButton } from '../icon-button/icon-button';
import { Menu } from '../menu/menu';
import { MenuItem } from '../menu/menu-item';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

export interface SplitButtonActionSelectEvent {
  /** The selected related action. */
  action: SplitButtonAction;
  /** Zero-based index in the `actions` input. */
  index: number;
}

/**
 * A primary action paired with a menu button for related actions.
 * @status beta
 * @category Action
 * @devx
 * - Provide `label` or an `icon` for the primary action; icon-only usage also requires `accessibleLabel`.
 * - `menuLabel` names both the trailing menu button and its popup.
 * - Each action has a unique, non-empty `id` and visible `label`; the action model is shared by all frameworks.
 * - Both prop bags forward primitive-specific options. SplitButton supplies each part's content and coordinates size, variant, shape, and disabled state.
 * - Each button morphs only its own inner corners on hover, focus-visible, and
 *   press. While the menu is open, only the trailing button keeps its expanded
 *   shape and selected state layer.
 * - `open` is controlled and supports `[(open)]`; `defaultOpen` initializes uncontrolled use.
 * @a11y
 * - Composes the shared Button and IconButton primitives; the trailing IconButton exposes `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls`.
 * - Enter and Space open the menu; Arrow Down and Arrow Up open it at the first and last enabled actions.
 * - The menu supports the shared Menu keyboard model. Escape closes it and restores focus to the menu button.
 * - Both button parts keep a 48px minimum touch target and a visible focus outline.
 * @limitations
 * - The primary action is an output; use a separate Link for primary navigation.
 * - Nested menu actions are not supported. Use a separate popup composition for submenus.
 * - `[class.x]` and `[ngClass]` bind to the `display: contents` host; use `class`, `[class]`, or `classes`.
 */
@Component({
  selector: 'udx-split-button',
  standalone: true,
  imports: [Button, IconButton, Menu, MenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @if (isValid()) {
      <div
        #root
        [class]="styles()['splitButton']"
        role="group"
        [attr.aria-label]="
          hasPrimaryLabel() ? label() : accessibleLabel() || menuLabel()
        "
        [attr.data-open]="isOpen()"
      >
        <udx-button
          #primaryButton
          [options]="primaryButtonProps()"
          [classes]="{
            button: styles()['primaryButton'],
            touchTarget: styles()['primaryTouchTarget'],
            stateLayer: styles()['primaryStateLayer'],
            icon: styles()['primaryIcon'],
            label: styles()['primaryLabel'],
          }"
          [label]="hasPrimaryLabel() ? label()! : accessibleLabel()!"
          [icon]="icon()"
          iconPosition="start"
          [variant]="variant()"
          [size]="size()"
          shape="rounded"
          shapeFeedback="none"
          [disabled]="disabled()"
          [aria-label]="
            hasPrimaryLabel() ? undefined : accessibleLabel() || undefined
          "
          (click)="runPrimaryAction()"
        />

        <udx-icon-button
          #menuButton
          [options]="resolvedMenuButtonProps()"
          [classes]="{
            iconButton: styles()['menuButton'],
            touchTarget: styles()['menuTouchTarget'],
            stateLayer: styles()['menuStateLayer'],
            icon: styles()['menuIcon'],
          }"
          [label]="menuLabel()"
          [icon]="arrowDownIcon"
          [variant]="menuVariant()"
          [size]="size()"
          [tooltip]="false"
          shape="rounded"
          shapeFeedback="none"
          [disabled]="disabled()"
          [aria-haspopup]="'menu'"
          [aria-expanded]="isOpen()"
          [aria-controls]="menuId()"
          (click)="toggleMenu()"
          (keydown)="handleMenuTriggerKeyDown($event)"
        />

        @if (isOpen()) {
          <div
            [id]="menuId()"
            [class]="styles()['menuSurface']"
            role="presentation"
            data-split-button-menu
          >
            <udx-menu
              purpose="actions"
              [accessibleLabel]="menuLabel()"
              [initialFocus]="menuInitialFocus()"
            >
              @for (action of actions(); track action.id; let index = $index) {
                <udx-menu-item
                  [label]="action.label"
                  [leadingIcon]="action.icon"
                  [href]="action.href"
                  [disabled]="disabled() || !!action.disabled"
                  (click)="selectAction(action, index)"
                />
              }
            </udx-menu>
          </div>
        }
      </div>
    }
  `,
})
export class SplitButton implements OnInit {
  /** Visible label for the primary action. */
  readonly label = input<string>();
  /** Optional leading icon for the primary action. */
  readonly icon = input<SplitButtonProps['icon']>();
  /** Accessible name used when the primary action has no visible label. */
  readonly accessibleLabel = input<string>();
  /** Accessible name shared by the trailing menu button and its popup. */
  readonly menuLabel = input.required<string>();
  /** Related actions with unique non-empty IDs and labels. */
  readonly actions = input.required<readonly SplitButtonAction[]>();
  /** Visual treatment. @default 'filled' */
  readonly variant = input<SplitButtonProps['variant']>('filled');
  /** Visual size. Every size retains a 48px touch target. @default 'small' */
  readonly size = input<SplitButtonProps['size']>('small');
  /** Additional options forwarded to the shared Button primitive. */
  readonly primaryButtonProps = input<
    NonNullable<SplitButtonProps['primaryButtonProps']>
  >({});
  /** Additional options forwarded to the shared IconButton primitive. */
  readonly menuButtonProps = input<
    NonNullable<SplitButtonProps['menuButtonProps']>
  >({});
  /** Disables both button parts and every menu action. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Controlled visibility of the related-actions menu. */
  readonly open = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  /** Initial menu visibility when `open` is uncontrolled. @default false */
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Classes applied to the root element. Native `class` and `[class]` bind here. */
  readonly hostClass = input<string>('', { alias: 'class' });
  /** Static or state-aware classes for internal elements, keyed by element name. */
  readonly classes = input<
    | ElementClasses<SplitButtonInterface>
    | ClassNameComponent<SplitButtonInterface>
  >();

  /** Emits when the primary action is activated. */
  readonly primaryAction = output<void>();
  /** Emits the selected action and its index before the menu closes. */
  readonly actionSelect = output<SplitButtonActionSelectEvent>();
  /** Emits when the component accepts an open-state request. */
  readonly openChange = output<boolean>();

  private readonly openState = createControllableState({
    value: this.open,
    defaultValue: this.defaultOpen,
    onChange: (open) => this.openChange.emit(open),
    componentName: 'SplitButton',
    stateName: 'open',
  });
  protected readonly isOpen = this.openState.value;
  protected readonly menuInitialFocus = signal<MenuInitialFocus>('first');
  protected readonly hasPrimaryLabel = computed(
    () => (this.label()?.trim() ?? '') !== '',
  );
  protected readonly isValid = computed(() =>
    isSplitButtonValid({
      label: this.label(),
      icon: this.icon(),
      accessibleLabel: this.accessibleLabel(),
      menuLabel: this.menuLabel(),
      actions: this.actions(),
    }),
  );
  protected readonly menuId = computed(
    () => `split-button-menu-${this.instanceId}`,
  );
  protected readonly arrowDownIcon = iKeyboardArrowDown;
  protected readonly menuVariant = computed(() =>
    getSplitButtonMenuVariant(this.variant()),
  );
  protected readonly stateColor = computed(() =>
    getButtonStateColor({
      variant: this.variant(),
      toggleable: false,
      isPressed: false,
    }),
  );
  protected readonly resolvedMenuButtonProps = computed(() => ({
    ...this.menuButtonProps(),
    stateColor: this.menuButtonProps()?.stateColor ?? this.stateColor(),
  }));
  protected readonly styles = createStyle(splitButtonStyle, () => ({
    label: this.label(),
    icon: this.icon(),
    accessibleLabel: this.accessibleLabel(),
    menuLabel: this.menuLabel(),
    actions: this.actions(),
    variant: this.variant(),
    size: this.size(),
    primaryButtonProps: this.primaryButtonProps(),
    menuButtonProps: this.menuButtonProps(),
    disabled: this.disabled(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    isOpen: this.isOpen(),
    className: mergeClassNames<SplitButtonInterface>(
      'splitButton',
      this.classes(),
      this.hostClass(),
    ),
  }));

  private static nextId = 0;
  private readonly instanceId = SplitButton.nextId++;
  private readonly root = viewChild<ElementRef<HTMLDivElement>>('root');
  private controller: SplitButtonController | undefined;

  constructor() {
    afterRenderEffect((onCleanup) => {
      const root = this.root()?.nativeElement;
      const primaryButton =
        root?.querySelector<HTMLButtonElement>('.primary-button');
      const menuButton = root?.querySelector<HTMLButtonElement>('.menu-button');
      const menuIcon = menuButton?.querySelector<HTMLElement>('.icon');
      if (!root || !primaryButton || !menuButton || !menuIcon) return;

      const controller = createSplitButtonController({
        root,
        primaryButton,
        menuButton,
        menuIcon,
        size: this.size(),
        onDismiss: (_reason: SplitButtonDismissReason) =>
          this.requestOpen('dismiss'),
      });
      this.controller = controller;
      onCleanup(() => {
        controller.destroy();
        if (this.controller === controller) this.controller = undefined;
      });
    });

    effect(() => {
      const isOpen = this.isOpen();
      this.controller?.setOpen(isOpen);
      if (this.disabled() && isOpen) this.requestOpen('dismiss');
    });
  }

  ngOnInit(): void {
    this.openState.initialize();
  }

  protected toggleMenu(): void {
    this.menuInitialFocus.set('first');
    this.requestOpen('trigger');
  }

  protected handleMenuTriggerKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.menuInitialFocus.set(event.key === 'ArrowUp' ? 'last' : 'first');
    this.requestOpen('keyboard');
  }

  protected runPrimaryAction(): void {
    this.primaryAction.emit();
    if (this.isOpen()) this.requestOpen('dismiss');
  }

  protected selectAction(action: SplitButtonAction, index: number): void {
    if (this.disabled() || action.disabled) return;
    this.actionSelect.emit({ action, index });
    if (!action.href) this.controller?.restoreFocusOnClose();
    this.requestOpen('dismiss');
  }

  private requestOpen(reason: 'trigger' | 'keyboard' | 'dismiss'): void {
    const transition = getSplitButtonOpenTransition({
      isOpen: this.isOpen(),
      disabled: this.disabled(),
      reason,
    });
    if (!transition.blocked) this.openState.set(transition.nextOpen);
  }
}
