import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  menuGroupStyle,
  type ClassNameComponent,
  type MenuGroupInterface,
  type MenuGroupProps,
} from '@udixio/core';
import { createStyle } from '../utils/create-style';
import { MENU_CONTEXT } from './menu-context';

/**
 * Groups related MenuItem children under an optional visible label.
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Projects MenuItem children and inherits the parent Menu variant.
 * @a11y A visible `label` names the semantic group; an unlabeled group is presentational.
 * @limitations Group labels are plain text.
 */
@Component({
  selector: 'udx-menu-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-menu-group': '',
    '[class]': "styles()['menuGroup']",
    '[attr.role]': "label() ? 'group' : 'presentation'",
    '[attr.aria-labelledby]': 'label() ? labelId : null',
  },
  template: `
    @if (label()) {
      <div [id]="labelId" [class]="styles()['groupLabel']">
        {{ label() }}
      </div>
    }
    <ng-content />
  `,
})
export class MenuGroup {
  readonly variant = input<MenuGroupProps['variant']>();
  readonly label = input<string>();
  readonly className = input<string | ClassNameComponent<MenuGroupInterface>>();

  private static nextId = 0;
  protected readonly labelId = `menu-group-${MenuGroup.nextId++}`;
  private readonly context = inject(MENU_CONTEXT, { optional: true });
  private readonly resolvedVariant = computed(
    () => this.variant() ?? this.context?.variant() ?? 'standard',
  );
  protected readonly styles = createStyle(menuGroupStyle, () => ({
    variant: this.resolvedVariant(),
    label: this.label(),
    className: this.className(),
  }));
}
