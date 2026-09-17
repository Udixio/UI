import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  menuHeadlineStyle,
  type ClassNameComponent,
  type ElementClasses,
  mergeClassNames,
  type MenuHeadlineInterface,
  type MenuHeadlineProps,
} from '@udixio/core';
import { createStyle } from '../utils/create-style';
import { MENU_CONTEXT } from './menu-context';

/**
 * A non-interactive visual heading inside a Menu.
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Use MenuGroup when the heading must also name a semantic group.
 * @a11y Rendered as presentational text and excluded from menu keyboard navigation.
 * @limitations Does not create a heading landmark or label neighboring items.
 */
@Component({
  selector: 'udx-menu-headline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "styles()['headline']",
    role: 'presentation',
  },
  template: `{{ label() }}`,
})
export class MenuHeadline {
  readonly label = input.required<string>();
  readonly variant = input<MenuHeadlineProps['variant']>();
  /** Classes applied to the root element. Angular's native `class` attribute and `[class]` binding land here, merged with the component's own classes. */
  readonly hostClass = input<string>('', { alias: 'class' });

  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  readonly classes = input<
    ElementClasses<MenuHeadlineInterface> | ClassNameComponent<MenuHeadlineInterface>
  >();

  private readonly context = inject(MENU_CONTEXT, { optional: true });
  private readonly resolvedVariant = computed(
    () => this.variant() ?? this.context?.variant() ?? 'standard',
  );
  protected readonly styles = createStyle(menuHeadlineStyle, () => ({
    label: this.label(),
    variant: this.resolvedVariant(),
    className: mergeClassNames<MenuHeadlineInterface>(
      'headline',
      this.classes(),
      this.hostClass(),
    ),
  }));
}
