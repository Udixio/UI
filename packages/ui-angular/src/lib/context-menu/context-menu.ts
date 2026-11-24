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
import {
  createContextMenuController,
  createMenuTransitionController,
  measureMenuBox,
  type MenuTransitionController,
  resolveContextMenuPosition,
  resolveBoxElement,
  showContextMenuPopover,
} from '@udixio/core/dom';
import { MENU_CONTEXT } from '../menu/menu-context';
import { Menu } from '../menu/menu';

/**
 * Opens a Menu at the pointer or keyboard context-menu position.
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Mark the projected trigger with `contextMenuTrigger`; project Menu family elements into the default slot.
 * @a11y Supports native context-menu events and Shift+F10, focuses the first item without scrolling the page, and restores trigger focus after Escape. A closing menu is inert at once and leaves the page once its exit has played; under reduced motion it opens and closes at once.
 * @limitations
 * - The popup position is internally owned and is not controllable.
 * - `[class.x]` and `[ngClass]` bind to the `display: contents` host and have no visible effect; use `class` or `[class]`.
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
  host: { class: '[&:not([hidden])]:contents', 'data-motion-box': 'child' },
  template: `
    <div #root [class]="hostClass()" style="display: contents">
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
          class="fixed z-50 rounded-lg"
          [attr.inert]="open() ? null : ''"
          popover="manual"
          [style.top.px]="point.y"
          [style.left.px]="point.x"
          style="inset: auto; margin: 0; right: auto; bottom: auto; max-width: calc(100vw - 16px); max-height: calc(100vh - 16px); overflow: visible"
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
  /** Classes applied to the root element. Angular's native `class` attribute and `[class]` binding land here, merged with the component's own classes. */
  readonly hostClass = input<string>('', { alias: 'class' });

  /** Notifies visibility changes caused by user interaction. */
  readonly openChange = output<boolean>();
  readonly purpose = () => 'actions' as const;

  /** The place of the popup while it is rendered: open, or playing its exit. */
  protected readonly position = signal<{ x: number; y: number } | null>(null);
  protected readonly open = signal(false);
  /** The pointer the menu opened at, which its scale grows from (the popup may be moved to stay in the viewport). */
  private point = { x: 0, y: 0 };
  private transition: MenuTransitionController | undefined;
  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
  private readonly trigger = viewChild<ElementRef<HTMLElement>>('trigger');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');

  constructor() {
    // One motion per popup: it grows from the pointer as it opens and shrinks
    // back as it closes; the popup is removed once its exit has ended.
    afterRenderEffect((onCleanup) => {
      const menu =
        this.popup()?.nativeElement.querySelector<HTMLElement>('[role="menu"]');
      if (!menu) return;
      const transition = createMenuTransitionController({
        menu,
        anchor: () => ({
          left: this.point.x,
          top: this.point.y,
          right: this.point.x,
          bottom: this.point.y,
        }),
        onExited: () => {
          if (!this.open()) this.position.set(null);
        },
      });
      this.transition = transition;
      onCleanup(() => {
        transition.destroy();
        if (this.transition === transition) this.transition = undefined;
      });
    });

    afterRenderEffect((onCleanup) => {
      const open = this.open();
      if (!this.position()) return;
      const root = this.root()?.nativeElement;
      const triggerHost = this.trigger()?.nativeElement;
      const popup = this.popup()?.nativeElement;
      const menu = popup?.querySelector<HTMLElement>('[role="menu"]');
      const triggerElement =
        triggerHost?.querySelector<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]',
        ) ?? triggerHost;
      if (!root || !triggerElement || !popup || !menu) return;
      showContextMenuPopover(popup);
      const ownerWindow = root.ownerDocument.defaultView;
      if (!ownerWindow) return;
      // Measured without the scale of a running motion, so a menu opened again while it leaves keeps its size.
      const menuRect = measureMenuBox(menu);
      const documentElement = root.ownerDocument.documentElement;
      const point = this.position();
      if (!point) return;
      const nextPosition = resolveContextMenuPosition(
        point,
        { width: menuRect.width, height: menuRect.height },
        {
          width: documentElement.clientWidth || ownerWindow.innerWidth,
          height: documentElement.clientHeight || ownerWindow.innerHeight,
        },
      );
      if (nextPosition.x !== point.x || nextPosition.y !== point.y) {
        this.position.set(nextPosition);
        return;
      }
      // Placed, before it is painted: the motion measures it for its origin.
      this.transition?.setOpen(open);
      if (!open) return;
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
    this.openAt(event.clientX, event.clientY);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (!event.shiftKey || event.key !== 'F10' || this.disabled()) return;
    event.preventDefault();
    const rect = this.getTriggerRect();
    this.openAt(rect?.left ?? 0, rect?.bottom ?? 0);
  }

  private getTriggerRect(): DOMRect | undefined {
    const trigger = this.trigger()?.nativeElement;
    return trigger
      ? resolveBoxElement(trigger).getBoundingClientRect()
      : undefined;
  }

  private openAt(x: number, y: number): void {
    const wasOpen = this.open();
    this.point = { x, y };
    this.open.set(true);
    this.position.set({ x, y });
    if (!wasOpen) this.openChange.emit(true);
  }

  /** The popup stays rendered, inert, while its exit plays; it is removed once the exit has ended. */
  protected close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.openChange.emit(false);
  }
}
