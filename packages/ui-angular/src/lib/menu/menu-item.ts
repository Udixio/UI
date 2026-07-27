import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  type OnInit,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  getMenuItemRole,
  getMenuItemSelectionTransition,
  menuItemStyle,
  type ClassNameComponent,
  type MenuItemInterface,
  type MenuItemProps,
} from '@udixio/core';
import { iCheck } from '@udixio/icons-rounded-400/check';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import { MENU_CONTEXT } from './menu-context';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

/**
 * An action or selectable choice within a Menu.
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Use `selectionType`, `selected`, and `selectedChange` for controlled selection, or initialize with `defaultSelected`.
 * @a11y Resolves to `menuitem`, `menuitemradio`, `menuitemcheckbox`, or `option`; disabled links are inert and removed from navigation.
 * @limitations Nested submenus require a separate popup composition. Angular uses the required `label` input instead of projected item content.
 */
@Component({
  selector: 'lib-menu-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @if (href()) {
      <a
        [class]="styles()['menuItem']"
        [attr.href]="disabled() ? null : href()"
        [attr.role]="role()"
        [attr.aria-disabled]="disabled() || null"
        [attr.aria-selected]="role() === 'option' ? isSelected() : null"
        [attr.aria-checked]="isCheckedRole() ? isSelected() : null"
        [attr.data-menu-disabled]="disabled() || null"
        [attr.tabindex]="disabled() ? -1 : 0"
        (click)="activate($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <button
        type="button"
        [class]="styles()['menuItem']"
        [disabled]="disabled()"
        [value]="value() ?? ''"
        [attr.role]="role()"
        [attr.aria-selected]="role() === 'option' ? isSelected() : null"
        [attr.aria-checked]="isCheckedRole() ? isSelected() : null"
        [attr.data-menu-disabled]="disabled() || null"
        (click)="activate($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }

    <ng-template #content>
      @if (!disabled()) {
        <lib-state-layer
          [className]="styles()['stateLayer']"
          [colorName]="stateColor()"
          stateClassName="state-ripple-group-[menu-item]"
        />
      }
      @if (resolvedLeadingIcon()) {
        <span
          aria-hidden="true"
          [class]="
            styles()['itemIcon'] +
            ' ' +
            styles()['leadingIcon'] +
            ' z-10 relative'
          "
        >
          <lib-icon [icon]="resolvedLeadingIcon()!" />
        </span>
      }
      <span [class]="styles()['itemLabel'] + ' z-10 relative'">
        {{ label() }}
      </span>
      @if (trailingIcon()) {
        <span
          aria-hidden="true"
          [class]="
            styles()['itemIcon'] +
            ' ' +
            styles()['trailingIcon'] +
            ' z-10 relative'
          "
        >
          <lib-icon [icon]="trailingIcon()!" />
        </span>
      }
    </ng-template>
  `,
  imports: [Icon, StateLayer, NgTemplateOutlet],
})
export class MenuItem implements OnInit {
  readonly label = input.required<string>();
  readonly value = input<MenuItemProps['value']>();
  /** Optional icon displayed before the label. */
  readonly leadingIcon = input<MenuItemProps['leadingIcon']>();
  /** Optional icon displayed after the label. */
  readonly trailingIcon = input<MenuItemProps['trailingIcon']>();
  /** Prevents activation, selection changes, and keyboard focus. */
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly variant = input<MenuItemProps['variant']>();
  readonly selectionType = input<MenuItemProps['selectionType']>();
  readonly selected = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly defaultSelected = input(false, { transform: booleanAttribute });
  /** Optional navigation target; disabled links omit the native href. */
  readonly href = input<string>();
  readonly className = input<string | ClassNameComponent<MenuItemInterface>>();

  /** Emits each accepted selected-state request and supports `[(selected)]`. */
  readonly selectedChange = output<boolean>();

  private readonly context = inject(MENU_CONTEXT, { optional: true });
  private readonly selection = createControllableState({
    value: this.selected,
    defaultValue: this.defaultSelected,
    onChange: (selected) => this.selectedChange.emit(selected),
    componentName: 'MenuItem',
    stateName: 'selected',
  });
  protected readonly isSelected = this.selection.value;
  protected readonly purpose = computed(
    () => this.context?.purpose() ?? 'actions',
  );
  protected readonly resolvedSelectionType = computed(
    () =>
      this.selectionType() ??
      (this.purpose() === 'selection' ? 'single' : 'none'),
  );
  protected readonly resolvedVariant = computed(
    () => this.variant() ?? this.context?.variant() ?? 'standard',
  );
  protected readonly role = computed(() =>
    getMenuItemRole({
      purpose: this.purpose(),
      selectionType: this.resolvedSelectionType(),
    }),
  );
  protected readonly isCheckedRole = computed(
    () => this.role() === 'menuitemcheckbox' || this.role() === 'menuitemradio',
  );
  protected readonly resolvedLeadingIcon = computed(() =>
    this.isSelected() && this.resolvedSelectionType() !== 'none'
      ? iCheck
      : this.leadingIcon(),
  );
  protected readonly stateColor = computed(() =>
    this.resolvedVariant() === 'vibrant' || this.isSelected()
      ? 'on-tertiary-container'
      : 'on-secondary-container',
  );
  protected readonly styles = createStyle(menuItemStyle, () => ({
    label: this.label(),
    value: this.value(),
    leadingIcon: this.leadingIcon(),
    trailingIcon: this.trailingIcon(),
    disabled: this.disabled(),
    variant: this.resolvedVariant(),
    selectionType: this.resolvedSelectionType(),
    selected: this.selected(),
    defaultSelected: this.defaultSelected(),
    onSelectedChange: undefined,
    isSelected: this.isSelected(),
    purpose: this.purpose(),
    className: this.className(),
  }));

  ngOnInit(): void {
    this.selection.initialize();
  }

  protected activate(event: Event): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    const transition = getMenuItemSelectionTransition({
      disabled: false,
      selectionType: this.resolvedSelectionType(),
      selected: this.isSelected(),
    });
    if (transition.nextSelected !== undefined) {
      this.selection.set(transition.nextSelected);
    }
  }
}
