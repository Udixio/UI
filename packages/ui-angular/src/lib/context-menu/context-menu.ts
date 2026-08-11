import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { ContextMenuProps, MenuVariant } from '@udixio/core';
import { createContextMenuController } from '@udixio/core/dom';
import { MENU_CONTEXT } from '../menu/menu-context';
import { Menu } from '../menu/menu';

/**
 * Opens a Menu at the pointer or keyboard context-menu position.
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Mark the projected trigger with `contextMenuTrigger`; project Menu family elements into the default slot.
 * @a11y Supports native context-menu events and Shift+F10, focuses the first item, and restores trigger focus after Escape.
 * @limitations The popup position is internally owned and is not controllable.
 */
@Component({
  selector: 'udx-context-menu',
  standalone: true,
  imports: [Menu],
  providers: [
    {
      provide: MENU_CONTEXT,
      useExisting: forwardRef(() => ContextMenu),
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div #root [class]="className()" style="display: contents">
      <span
        #trigger
        style="display: contents"
        (contextmenu)="handleContextMenu($event)"
        (keydown)="handleKeydown($event)"
      >
        <ng-content select="[contextMenuTrigger]" />
      </span>
      @if (position(); as point) {
        <div
          #popup
          class="fixed z-50"
          [style.top.px]="point.y"
          [style.left.px]="point.x"
          (click)="close()"
        >
          <udx-menu
            purpose="actions"
            [variant]="variant()"
            [accessibleLabel]="accessibleLabel()"
          >
            <ng-content />
          </udx-menu>
        </div>
      }
    </div>
  `,
})
export class ContextMenu {
  readonly variant = input<MenuVariant>('standard');
  readonly accessibleLabel = input<ContextMenuProps['accessibleLabel']>();
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Classes applied to the display-contents root. */
  readonly className = input<string>();

  /** Notifies visibility changes caused by user interaction. */
  readonly openChange = output<boolean>();
  readonly purpose = () => 'actions' as const;

  protected readonly position = signal<{ x: number; y: number } | null>(null);
  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
  private readonly trigger = viewChild<ElementRef<HTMLElement>>('trigger');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');

  constructor() {
    afterRenderEffect((onCleanup) => {
      if (!this.position()) return;
      const root = this.root()?.nativeElement;
      const triggerHost = this.trigger()?.nativeElement;
      const menu =
        this.popup()?.nativeElement.querySelector<HTMLElement>('[role="menu"]');
      const triggerElement =
        triggerHost?.querySelector<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]',
        ) ?? triggerHost;
      if (!root || !triggerElement || !menu) return;
      const controller = createContextMenuController({
        root,
        trigger: triggerElement,
        menu,
        onDismiss: () => this.close(),
      });
      onCleanup(() => controller.destroy());
    });
  }

  protected handleContextMenu(event: MouseEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.openAt(event.clientX || rect.left, event.clientY || rect.bottom);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (!event.shiftKey || event.key !== 'F10' || this.disabled()) return;
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.openAt(rect.left, rect.bottom);
  }

  private openAt(x: number, y: number): void {
    const wasOpen = Boolean(this.position());
    this.position.set({ x, y });
    if (!wasOpen) this.openChange.emit(true);
  }

  protected close(): void {
    if (!this.position()) return;
    this.position.set(null);
    this.openChange.emit(false);
  }
}
