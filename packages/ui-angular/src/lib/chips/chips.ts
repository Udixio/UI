import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import {
  chipsStyle,
  type ChipItem,
  type ChipsInterface,
  type ChipsProps,
  type ClassNameComponent,
} from '@udixio/core';
import { Chip } from '../chip/chip';
import { createStyle } from '../utils/create-style';

/**
 * A labelled collection of selectable or editable chips.
 * @status beta
 * @category Input
 * @devx Pass stable `ChipItem.id` values when the collection can be reordered and replace the list from `itemsChange`.
 * @a11y Renders a labelled list; each chip retains its native button or link semantics.
 * @limitations Does not virtualize large lists.
 */
@Component({
  selector: 'lib-chips',
  standalone: true,
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div role="list" [attr.aria-label]="label()" [class]="styles()['chips']">
      @for (item of items(); track item.id ?? $index) {
        <lib-chip
          role="listitem"
          [label]="item.label"
          [icon]="item.icon"
          [variant]="item.variant"
          [disabled]="item.disabled || false"
          [href]="item.href"
          [selected]="item.selected"
          [removable]="variant() === 'input' || item.removable || false"
          [editable]="variant() === 'input'"
          [draggable]="draggable()"
          (selectedChange)="replaceSelection($index, $event)"
          (editCommit)="replaceLabel($index, $event)"
          (remove)="removeItem($index)"
        />
      }
    </div>
  `,
})
export class Chips {
  readonly label = input('Chips');
  readonly variant = input<ChipsProps['variant']>('input');
  readonly items = input.required<readonly ChipItem[]>();
  readonly scrollable = input(true, { transform: booleanAttribute });
  readonly draggable = input(false, { transform: booleanAttribute });
  readonly className = input<string | ClassNameComponent<ChipsInterface>>();

  /** Notifies list changes caused by selection, editing, or removal. */
  readonly itemsChange = output<ChipItem[]>();

  protected readonly styles = createStyle(chipsStyle, () => ({
    label: this.label(),
    variant: this.variant(),
    items: [...this.items()],
    onItemsChange: () => undefined,
    scrollable: this.scrollable(),
    draggable: this.draggable(),
    className: this.className(),
  }));

  protected replaceSelection(index: number, selected: boolean): void {
    this.itemsChange.emit(
      this.items().map((item, itemIndex) =>
        itemIndex === index ? { ...item, selected } : item,
      ),
    );
  }

  protected replaceLabel(index: number, label: string): void {
    this.itemsChange.emit(
      this.items().map((item, itemIndex) =>
        itemIndex === index ? { ...item, label } : item,
      ),
    );
  }

  protected removeItem(index: number): void {
    this.itemsChange.emit(
      this.items().filter((_item, itemIndex) => itemIndex !== index),
    );
  }
}
