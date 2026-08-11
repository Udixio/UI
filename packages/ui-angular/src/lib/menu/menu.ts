import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  forwardRef,
  input,
  viewChild,
} from '@angular/core';
import {
  menuStyle,
  type ClassNameComponent,
  type MenuInterface,
  type MenuProps,
} from '@udixio/core';
import { createMenuController } from '@udixio/core/dom';
import { createStyle } from '../utils/create-style';
import { MENU_CONTEXT } from './menu-context';
import { MenuGroup } from './menu-group';

/**
 * Displays commands or selectable options on a temporary surface.
 * @status beta
 * @category Selection
 * @devx Use `purpose="actions"` for commands and `purpose="selection"` for options. Set `initialFocus` for popup usage. When using groups, project each related MenuHeadline inside its MenuGroup.
 * @a11y Implements wrapping Arrow Up/Down, Home, End, and type-ahead focus navigation. Provide `accessibleLabel` unless the menu is labelled externally.
 * @limitations Nested submenus are not part of this component; compose another popup from an item trigger.
 */
@Component({
  selector: 'udx-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: MENU_CONTEXT, useExisting: forwardRef(() => Menu) }],
  host: { style: 'display: contents' },
  template: `
    <div
      #root
      [class]="styles()['menu']"
      [attr.role]="purpose() === 'selection' ? 'listbox' : 'menu'"
      [attr.aria-label]="accessibleLabel() || null"
    >
      <ng-content />
    </div>
  `,
})
export class Menu {
  readonly variant = input<MenuProps['variant']>('standard');
  readonly purpose = input<MenuProps['purpose']>('actions');
  readonly accessibleLabel = input<string>();
  readonly initialFocus = input<MenuProps['initialFocus']>('none');
  readonly className = input<string | ClassNameComponent<MenuInterface>>();

  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
  private readonly groups = contentChildren(MenuGroup, {
    descendants: true,
  });
  private readonly hasGroups = computed(() => this.groups().length > 0);
  protected readonly styles = createStyle(menuStyle, () => ({
    variant: this.variant(),
    purpose: this.purpose(),
    accessibleLabel: this.accessibleLabel(),
    initialFocus: this.initialFocus(),
    hasGroups: this.hasGroups(),
    className: this.className(),
  }));

  constructor() {
    afterRenderEffect((onCleanup) => {
      const root = this.root()?.nativeElement;
      if (!root) return;
      const controller = createMenuController(root, {
        initialFocus: this.initialFocus(),
      });
      onCleanup(() => controller.destroy());
    });
  }
}
