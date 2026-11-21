import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  menuItemStyle,
  type ClassNameComponent,
  type ElementClasses,
  mergeClassNames,
  type MenuItemInterface,
  type MenuSubmenuProps,
} from '@udixio/core';
import {
  createAnchorPositionerController,
  createMenuSubmenuController,
  createMenuTransitionController,
  type MenuTransitionController,
} from '@udixio/core/dom';
import { iChevronRight } from '@udixio/icons-rounded-400/chevron_right';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { createStyle } from '../utils/create-style';
import { MENU_CONTEXT } from './menu-context';
import { Menu } from './menu';

/**
 * An action menu item that opens a nested actions menu.
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Place it inside an actions Menu and project MenuItem-family elements as children. The nested menu inherits the parent variant. It stays in the DOM while closed, hidden; pass `lazy` to render it only while open. Opening, the nested menu grows from the side of its trigger (scale 0.8 to 1 on the fast spatial spring, fade on the fast effects spring); it leaves faster, on the fast effects spring.
 * @a11y Arrow Right (Arrow Left in RTL) opens and focuses the first item; the opposite arrow or Escape closes and restores trigger focus. Pointer hover opens the submenu. A closing submenu is inert at once and hidden once its exit has played; under reduced motion it opens and closes at once.
 * @limitations Use only in action menus, not in `purpose="selection"` listboxes. `[class.x]` and `[ngClass]` bind to the display-contents host; use `class`, `[class]`, or `triggerClasses`.
 */
@Component({
  selector: 'udx-menu-submenu',
  standalone: true,
  imports: [Icon, Menu, StateLayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <button
      #trigger
      type="button"
      [class]="styles()['menuItem']"
      role="menuitem"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [attr.aria-disabled]="disabled() || null"
      [attr.data-menu-disabled]="disabled() ? 'true' : null"
      [attr.data-menu-leading-icon]="leadingIcon() ? 'true' : null"
      [disabled]="disabled()"
    >
      @if (!disabled()) {
        <udx-state-layer
          [class]="styles()['stateLayer']"
          [colorName]="
            resolvedVariant() === 'vibrant'
              ? 'on-tertiary-container'
              : 'on-secondary-container'
          "
          stateClassName="state-ripple-group-[menu-item]"
        />
      }
      @if (leadingIcon()) {
        <span
          aria-hidden="true"
          data-menu-leading-icon-slot
          style="display: none"
          [class]="
            styles()['itemIcon'] +
            ' ' +
            styles()['leadingIcon'] +
            ' z-10 relative'
          "
        >
          <udx-icon [icon]="leadingIcon()!" />
        </span>
      } @else {
        <span
          aria-hidden="true"
          data-menu-leading-icon-slot
          [class]="
            styles()['itemIcon'] +
            ' ' +
            styles()['leadingIcon'] +
            ' z-10 relative'
          "
        ></span>
      }
      <span [class]="styles()['itemLabel'] + ' z-10 relative'">{{
        label()
      }}</span>
      <span
        aria-hidden="true"
        [class]="
          styles()['itemIcon'] +
          ' ' +
          styles()['trailingIcon'] +
          ' z-10 relative rtl:rotate-180'
        "
      >
        <udx-icon [icon]="chevronRightIcon" />
      </span>
    </button>
    @if (!lazy() || shown()) {
      <div
        #submenuSurface
        data-menu-submenu-surface
        style="z-index: 50"
        [hidden]="!shown()"
        [attr.inert]="open() ? null : ''"
      >
        <udx-menu
          purpose="actions"
          [variant]="resolvedVariant()"
          [accessibleLabel]="accessibleLabel() || label() + ' submenu'"
        >
          <ng-content />
        </udx-menu>
      </div>
    }
  `,
})
export class MenuSubmenu {
  private readonly interactionState = { openedByHover: false };
  /** Visible name for the submenu trigger. */
  readonly label = input.required<MenuSubmenuProps['label']>();
  /** Optional icon displayed before the trigger label. */
  readonly leadingIcon = input<MenuSubmenuProps['leadingIcon']>();
  /** Prevents opening the nested menu and removes the trigger from navigation. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Overrides the color treatment inherited from the parent Menu. */
  readonly variant = input<MenuSubmenuProps['variant']>();
  /** Accessible name for the nested menu; defaults to "{label} submenu". */
  readonly accessibleLabel = input<MenuSubmenuProps['accessibleLabel']>();
  /** Renders the nested menu only while the submenu is open. By default it stays in the DOM, hidden, so its links are in the server HTML. */
  readonly lazy = input(false, { transform: booleanAttribute });
  /** State-aware classes applied to the trigger using the MenuItem style contract. */
  readonly triggerClasses = input<
    ElementClasses<MenuItemInterface> | ClassNameComponent<MenuItemInterface>
  >();
  /** Classes merged onto the submenu trigger. */
  readonly hostClass = input<string>('', { alias: 'class' });

  protected readonly open = signal(false);
  /** Whether the closed submenu has finished its exit: until then it stays shown (inert), then it is hidden. */
  private readonly exited = signal(true);
  protected readonly shown = computed(() => this.open() || !this.exited());
  private transition: MenuTransitionController | undefined;
  protected readonly chevronRightIcon = iChevronRight;
  private readonly context = inject(MENU_CONTEXT, { optional: true });
  private readonly triggerRef =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly submenuSurface =
    viewChild<ElementRef<HTMLElement>>('submenuSurface');
  protected readonly resolvedVariant = computed(
    () => this.variant() ?? this.context?.variant() ?? 'standard',
  );
  protected readonly styles = createStyle(menuItemStyle, () => ({
    label: this.label(),
    value: undefined,
    leadingIcon: this.leadingIcon(),
    trailingIcon: iChevronRight,
    disabled: this.disabled(),
    variant: this.resolvedVariant(),
    selectionType: 'none' as const,
    selected: undefined,
    defaultSelected: false,
    onSelectedChange: undefined,
    isSelected: false,
    purpose: 'actions' as const,
    className: mergeClassNames<MenuItemInterface>(
      'menuItem',
      this.triggerClasses(),
      this.hostClass(),
    ),
  }));

  constructor() {
    afterRenderEffect((onCleanup) => {
      const trigger = this.triggerRef()?.nativeElement;
      const menu =
        this.submenuSurface()?.nativeElement.querySelector<HTMLElement>(
          '[role="menu"]',
        );
      if (!trigger) return;
      const controller = createMenuSubmenuController({
        trigger,
        menu,
        getMenu: () =>
          this.submenuSurface()?.nativeElement.querySelector<HTMLElement>(
            '[role="menu"]',
          ),
        interactionState: this.interactionState,
        isOpen: this.open,
        onOpen: () => {
          if (this.disabled()) return;
          this.exited.set(false);
          this.open.set(true);
        },
        onClose: () => this.open.set(false),
      });
      onCleanup(() => controller.destroy());
    });

    // One motion per nested menu element: it grows from the trigger as it
    // opens and shrinks back as it closes.
    afterRenderEffect((onCleanup) => {
      const trigger = this.triggerRef()?.nativeElement;
      const menu =
        this.submenuSurface()?.nativeElement.querySelector<HTMLElement>(
          '[role="menu"]',
        );
      if (!trigger || !menu) return;
      const transition = createMenuTransitionController({
        menu,
        anchor: trigger,
        onExited: () => {
          if (!this.open()) this.exited.set(true);
        },
      });
      this.transition = transition;
      onCleanup(() => {
        transition.destroy();
        if (this.transition === transition) this.transition = undefined;
      });
    });

    // Positioned against the trigger while shown, open or leaving, after the
    // render that showed the surface and before the browser paints it. The
    // motion measures the placed menu for its origin.
    afterRenderEffect((onCleanup) => {
      const trigger = this.triggerRef()?.nativeElement;
      const surface = this.submenuSurface()?.nativeElement;
      const open = this.open();
      if (!this.shown() || !trigger || !surface) return;
      const positioned = createAnchorPositionerController({
        anchor: trigger,
        floating: surface,
        position: () => 'auto',
        autoAxis: () => 'horizontal',
        inheritThemeScope: false,
      });
      this.transition?.setOpen(open);
      onCleanup(() => positioned.destroy());
    });
  }
}
