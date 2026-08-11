import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
  viewChild,
  type OnInit,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  chipStyle,
  getChipSelectionTransition,
  type ChipInterface,
  type ChipProps,
  type ClassNameComponent,
} from '@udixio/core';
import { iCheck } from '@udixio/icons-rounded-400/check';
import { iClose } from '@udixio/icons-rounded-400/close';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';

/**
 * A compact action, link, editable value, or selectable option.
 * @status beta
 * @category Action
 * @devx Bind `selected` and `selectedChange` for controlled selection, or initialize with `defaultSelected`.
 * @a11y Uses a native button or link and exposes `aria-pressed` only in selection mode. Backspace and Delete remove a removable chip.
 * @limitations The delayed edit-on-focus behavior remains specific to the React adapter.
 */
@Component({
  selector: 'udx-chip',
  standalone: true,
  imports: [Icon, StateLayer, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @if (href()) {
      <a
        [class]="styles()['chip']"
        [attr.href]="disabled() ? null : href()"
        [attr.aria-disabled]="disabled() || null"
        [attr.aria-pressed]="selectable() ? isSelected() : null"
        [attr.draggable]="!disabled() && draggable()"
        [attr.tabindex]="disabled() ? -1 : null"
        (click)="activate($event)"
        (dblclick)="startEditing($event)"
        (focus)="isFocused.set(true)"
        (blur)="handleBlur($event)"
        (keydown)="handleKeydown($event)"
        (dragstart)="handleDragStart()"
        (dragend)="isDragging.set(false)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <button
        type="button"
        [class]="styles()['chip']"
        [disabled]="disabled()"
        [attr.aria-pressed]="selectable() ? isSelected() : null"
        [attr.draggable]="!disabled() && draggable()"
        (click)="activate($event)"
        (dblclick)="startEditing($event)"
        (focus)="isFocused.set(true)"
        (blur)="handleBlur($event)"
        (keydown)="handleKeydown($event)"
        (dragstart)="handleDragStart()"
        (dragend)="isDragging.set(false)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }

    <ng-template #content>
      @if (interactive() && !disabled() && !isEditing()) {
        <udx-state-layer
          [className]="styles()['stateLayer']"
          [colorName]="stateColor()"
          stateClassName="state-ripple-group-[chip]"
        />
      }
      @if (resolvedIcon()) {
        <udx-icon
          [icon]="resolvedIcon()!"
          [className]="styles()['leadingIcon']"
        />
      }
      <span
        #labelElement
        [class]="styles()['label']"
        [attr.contenteditable]="isEditing() ? 'true' : null"
        [attr.role]="editable() ? 'textbox' : null"
        [attr.spellcheck]="isEditing() ? 'false' : null"
        [textContent]="isEditing() ? editValue() : label()"
        (input)="handleInput($event)"
      ></span>
      @if (removable() && !isEditing()) {
        <span
          aria-hidden="true"
          [class]="styles()['trailingIcon']"
          (mousedown)="$event.preventDefault(); $event.stopPropagation()"
          (click)="requestRemoval($event)"
        >
          <udx-icon [icon]="removeIcon" className="size-full" />
        </span>
      }
    </ng-template>
  `,
})
export class Chip implements OnInit {
  readonly label = input.required<string>();
  readonly variant = input<ChipProps['variant']>('outlined');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly icon = input<ChipProps['icon']>();
  readonly href = input<string>();
  readonly selected = input<boolean | undefined>(undefined);
  readonly defaultSelected = input<boolean | undefined>(undefined, {
    transform: (value) =>
      value === undefined ? undefined : booleanAttribute(value),
  });
  /** Shows a trailing action that requests removal through the `remove` output. */
  readonly removable = input(false, { transform: booleanAttribute });
  readonly draggable = input(false, { transform: booleanAttribute });
  readonly editable = input(false, { transform: booleanAttribute });
  readonly editing = input<boolean | undefined>(undefined);
  readonly className = input<string | ClassNameComponent<ChipInterface>>();

  readonly selectedChange = output<boolean>();
  /** Requests removal of this chip. */
  readonly remove = output<void>();
  /** Requests entry into inline editing mode. */
  readonly editStart = output<void>();
  /** Commits inline editing with the normalized label. */
  readonly editCommit = output<string>();
  /** Cancels inline editing. */
  readonly editCancel = output<void>();
  /** Emits every inline label change. */
  readonly valueChange = output<string>();

  private readonly selection = createControllableState({
    value: this.selected,
    defaultValue: computed(() => this.defaultSelected() ?? false),
    onChange: (value) => this.selectedChange.emit(value),
    componentName: 'Chip',
    stateName: 'selected',
  });
  private readonly internalEditing = signal(false);
  protected readonly editValue = signal('');
  private readonly labelElement =
    viewChild<ElementRef<HTMLElement>>('labelElement');

  protected readonly isSelected = this.selection.value;
  protected readonly isFocused = signal(false);
  protected readonly isDragging = signal(false);
  protected readonly isEditing = computed(() => {
    const controlledEditing = this.editing();
    return (
      this.editable() && (controlledEditing ?? this.internalEditing())
    );
  });
  protected readonly selectable = computed(
    () =>
      this.selected() !== undefined || this.defaultSelected() !== undefined,
  );
  protected readonly interactive = computed(
    () =>
      this.selectable() ||
      this.removable() ||
      !!this.href() ||
      this.editable(),
  );
  protected readonly resolvedIcon = computed(() =>
    this.isSelected() ? iCheck : this.icon(),
  );
  protected readonly stateColor = computed(() =>
    this.isSelected() ? 'on-secondary-container' : 'on-surface-variant',
  );
  protected readonly removeIcon = iClose;
  protected readonly styles = createStyle(chipStyle, () => ({
    label: this.label(),
    variant: this.variant(),
    disabled: this.disabled(),
    icon: this.icon(),
    href: this.href(),
    selected: this.selected(),
    defaultSelected: this.defaultSelected(),
    onSelectedChange: undefined,
    onRemove: this.removable() ? () => undefined : undefined,
    draggable: this.draggable(),
    editable: this.editable(),
    editing: this.editing(),
    onEditStart: undefined,
    onEditCommit: undefined,
    onEditCancel: undefined,
    onChange: undefined,
    isSelected: this.isSelected(),
    isFocused: this.isFocused(),
    isInteractive: this.interactive(),
    isDragging: this.isDragging(),
    isEditing: this.isEditing(),
    trailingIcon: this.removable() && !this.isEditing(),
    className: this.className(),
  }));

  ngOnInit(): void {
    this.selection.initialize();
    this.editValue.set(this.label());
  }

  protected activate(event: Event): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    if (!this.selectable()) return;

    const transition = getChipSelectionTransition({
      disabled: false,
      selected: this.isSelected(),
    });
    if (transition.nextSelected !== undefined) {
      this.selection.set(transition.nextSelected);
    }
  }

  protected startEditing(event: Event): void {
    if (this.disabled() || !this.editable()) return;
    event.preventDefault();
    this.editValue.set(this.label());
    if (this.editing() === undefined) this.internalEditing.set(true);
    this.editStart.emit();
    queueMicrotask(() => this.labelElement()?.nativeElement.focus());
  }

  protected handleInput(event: Event): void {
    if (!this.isEditing()) return;
    const value = (event.currentTarget as HTMLElement).innerText;
    this.editValue.set(value);
    this.valueChange.emit(value);
  }

  protected handleBlur(event: FocusEvent): void {
    if (
      event.relatedTarget instanceof Node &&
      (event.currentTarget as HTMLElement).contains(event.relatedTarget)
    ) {
      return;
    }
    this.isFocused.set(false);
    if (this.isEditing()) this.commitEditing();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    if (this.isEditing()) {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.commitEditing();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (this.editing() === undefined) this.internalEditing.set(false);
        this.editCancel.emit();
      }
      return;
    }

    if (
      this.editable() &&
      !this.selectable() &&
      (event.key === 'F2' || event.key === 'Enter')
    ) {
      this.startEditing(event);
      return;
    }
    if (
      this.href() &&
      this.selectable() &&
      (event.key === ' ' || event.key === 'Spacebar')
    ) {
      event.preventDefault();
      this.activate(event);
      return;
    }
    if (
      this.removable() &&
      ['Backspace', 'Delete', 'Del'].includes(event.key)
    ) {
      event.preventDefault();
      this.remove.emit();
    }
  }

  protected handleDragStart(): void {
    if (!this.disabled() && this.draggable()) this.isDragging.set(true);
  }

  protected requestRemoval(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled()) this.remove.emit();
  }

  private commitEditing(): void {
    const value = this.editValue().trim();
    if (this.editing() === undefined) this.internalEditing.set(false);
    if (!value && this.removable()) {
      this.remove.emit();
      return;
    }
    this.editCommit.emit(value);
  }
}
