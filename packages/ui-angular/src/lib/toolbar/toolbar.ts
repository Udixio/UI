import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  TemplateRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  splitToolbarActions,
  type AnchorPosition,
  type ClassNameComponent,
  type ElementClasses,
  type Icon,
  type ToolbarAction,
  type ToolbarInterface,
  type ToolbarMoreProps,
  type ToolbarProps,
  toolbarStyle,
  mergeClassNames,
} from '@udixio/core';
import { iMoreVert } from '@udixio/icons-rounded-400/more_vert';
import { AnchorPositioner } from '../anchor-positioner/anchor-positioner';
import { IconButton } from '../icon-button/icon-button';
import { Menu } from '../menu/menu';
import { MenuItem } from '../menu/menu-item';
import { createStyle } from '../utils/create-style';

export interface AngularToolbarAction extends ToolbarAction {
  /** Runs when an action without an `href` is activated. */
  onClick?: () => void;
  /** Receives accepted toggle-state changes. */
  onToggle?: (pressed: boolean) => void;
}

export interface ToolbarMoreContext {
  $implicit: readonly AngularToolbarAction[];
  actions: readonly AngularToolbarAction[];
  label: string;
  icon: Icon;
  variant: NonNullable<ToolbarMoreProps['variant']>;
  size: NonNullable<ToolbarMoreProps['size']>;
  open: boolean;
  ariaHasPopup: 'menu';
  ariaExpanded: boolean;
  toggle: () => void;
}

/**
 * Toolbars group related actions in a docked or floating container.
 *
 * @status beta
 * @category Layout
 * @devx
 * - Compose `udx-icon-button` children or pass `actions` for a data-driven action group.
 * - `maxVisible` moves the remaining actions into an automatic overflow menu;
 *   `responsive` derives the visible count from the toolbar width.
 * - `more` customizes the default overflow trigger and `moreTemplate` replaces
 *   its visual rendering while keeping the menu behavior.
 * - The generated overflow menu chooses above/below or left/right from the
 *   toolbar orientation and the trigger's viewport half; `morePosition` can
 *   force a placement.
 * - Descendant `udx-icon-button` controls keep rounded press feedback in
 *   floating toolbars.
 * - Use `variant="floating"` for a compact surface and
 *   `orientation="vertical"` for a vertical action group.
 * @a11y
 * - Renders `role="toolbar"` and applies `aria-orientation="vertical"` for
 *   vertical layouts.
 * - The overflow trigger has an accessible label and the generated menu uses
 *   the labels from each action.
 * - Provide `accessibleLabel` or an `aria-labelledby` reference to name the
 *   toolbar; label each child control according to its own component API.
 * @limitations
 * - `actions` and projected children are alternative content modes; `actions`
 *   takes precedence.
 * - The toolbar does not implement roving focus or arrow-key navigation for its
 *   direct children. The overflow menu owns menu-item keyboard navigation.
 * - Composition children remain consumer-owned; use `size="small"` on
 *   `udx-icon-button` for the 48dp toolbar slots shown in Material 3.
 * - `[class.x]` and `[ngClass]` bind to the `display: contents` host and have
 *   no visible effect; use `class`, `[class]`, or `classes`.
 */
@Component({
  selector: 'udx-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: contents',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeMore()',
  },
  imports: [AnchorPositioner, IconButton, Menu, MenuItem, NgTemplateOutlet],
  template: `
    <div
      #root
      [class]="styles()['toolbar']"
      role="toolbar"
      [attr.data-udx-toolbar-variant]="variant()"
      [attr.data-udx-toolbar-orientation]="orientation()"
      [attr.aria-label]="accessibleLabel() || null"
      [attr.aria-labelledby]="ariaLabelledBy() || null"
      [attr.aria-orientation]="ariaOrientation()"
    >
      @if (actions() !== undefined) {
        @for (action of visibleActions(); track action.id) {
          <udx-icon-button
            [label]="action.label"
            [icon]="action.icon"
            [tooltip]="action.tooltip"
            [pressedIcon]="action.pressedIcon"
            [variant]="action.variant"
            [size]="action.size ?? 'small'"
            [width]="action.width"
            [disabled]="action.disabled ?? false"
            [shape]="action.shape"
            [shapeFeedback]="action.shapeFeedback ?? 'morph'"
            [transition]="action.transition"
            [toggleable]="action.toggleable ?? false"
            [pressed]="action.pressed"
            [defaultPressed]="action.defaultPressed ?? false"
            [href]="action.href"
            (click)="runAction(action)"
            (pressedChange)="action.onToggle?.($event)"
          />
        }
        @if (overflowActions().length > 0) {
          <span #moreTrigger class="shrink-0">
            @if (moreTemplate(); as template) {
              <ng-container
                [ngTemplateOutlet]="template"
                [ngTemplateOutletContext]="moreContext()"
              />
            } @else {
              <udx-icon-button
                [label]="moreLabel()"
                [icon]="moreIcon()"
                [tooltip]="false"
                [variant]="moreVariant()"
                [size]="moreSize()"
                aria-haspopup="menu"
                [aria-expanded]="open()"
                (click)="toggleMore($event)"
              />
            }
          </span>
        }
      } @else {
        <ng-content />
      }
    </div>

    @if (open() && overflowActions().length > 0 && moreTrigger(); as trigger) {
      <udx-anchor-positioner
        [anchor]="trigger"
        [position]="morePosition()"
        [autoAxis]="orientation() === 'vertical' ? 'horizontal' : 'vertical'"
      >
        <udx-menu
          purpose="actions"
          [accessibleLabel]="moreLabel()"
          initialFocus="first"
          (click)="$event.stopPropagation()"
        >
          @for (action of overflowActions(); track action.id) {
            <udx-menu-item
              [label]="action.label"
              [leadingIcon]="action.icon"
              [href]="action.href"
              [disabled]="action.disabled ?? false"
              (click)="selectAction(action)"
            />
          }
        </udx-menu>
      </udx-anchor-positioner>
    }
  `,
})
export class Toolbar {
  readonly variant = input<ToolbarProps['variant']>('docked');
  readonly color = input<ToolbarProps['color']>('standard');
  readonly orientation = input<ToolbarProps['orientation']>('horizontal');
  readonly accessibleLabel = input<ToolbarProps['accessibleLabel']>();
  /** ID of an external element that labels the toolbar. */
  readonly ariaLabelledBy = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  /** Data-driven actions rendered as icon buttons with automatic overflow. */
  readonly actions = input<readonly AngularToolbarAction[]>();
  /** Maximum number of non-pinned actions shown in the toolbar. */
  readonly maxVisible = input<number>();
  /** Measures the toolbar and reserves one action slot for overflow when needed. */
  readonly responsive = input(false, { transform: booleanAttribute });
  /** Estimated width of one action slot when `responsive` is enabled. */
  readonly itemWidth = input(48);
  /** Presentation options for the default overflow trigger. */
  readonly more = input<ToolbarMoreProps>();
  /** Position of the generated overflow menu relative to the More trigger. */
  readonly morePosition = input<AnchorPosition>('auto');
  /** Template that replaces the default overflow trigger. */
  readonly moreTemplate = input<TemplateRef<ToolbarMoreContext>>();

  /** Classes applied to the root element. Angular's native `class` attribute and `[class]` binding land here, merged with the component's own classes. */
  readonly hostClass = input<string>('', { alias: 'class' });

  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  readonly classes = input<
    ElementClasses<ToolbarInterface> | ClassNameComponent<ToolbarInterface>
  >();

  readonly moreOpenChange = output<boolean>();

  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
  protected readonly moreTrigger =
    viewChild<ElementRef<HTMLElement>>('moreTrigger');
  private readonly availableWidth = signal(Number.POSITIVE_INFINITY);
  protected readonly open = signal(false);

  protected readonly ariaOrientation = computed(() =>
    this.orientation() === 'vertical' ? 'vertical' : null,
  );

  protected readonly split = computed(() =>
    splitToolbarActions({
      actions: this.actions() ?? [],
      maxVisible: this.maxVisible(),
      responsive: this.responsive(),
      availableWidth: this.availableWidth(),
      itemWidth: this.itemWidth(),
    }),
  );
  protected readonly visibleActions = computed(
    () => this.split().visible as readonly AngularToolbarAction[],
  );
  protected readonly overflowActions = computed(
    () => this.split().overflow as readonly AngularToolbarAction[],
  );
  protected readonly moreLabel = computed(
    () => this.more()?.label ?? 'More actions',
  );
  protected readonly moreIcon = computed(() => this.more()?.icon ?? iMoreVert);
  protected readonly moreVariant = computed(
    () => this.more()?.variant ?? 'standard',
  );
  protected readonly moreSize = computed(() => this.more()?.size ?? 'small');
  protected readonly moreContext = computed<ToolbarMoreContext>(() => ({
    $implicit: this.overflowActions(),
    actions: this.overflowActions(),
    label: this.moreLabel(),
    icon: this.moreIcon(),
    variant: this.moreVariant(),
    size: this.moreSize(),
    open: this.open(),
    ariaHasPopup: 'menu',
    ariaExpanded: this.open(),
    toggle: () => this.toggleMore(),
  }));

  constructor() {
    const zone = inject(NgZone);

    afterRenderEffect((onCleanup) => {
      const root = this.root()?.nativeElement;
      if (
        !root ||
        !this.responsive() ||
        typeof ResizeObserver === 'undefined'
      ) {
        return;
      }

      const observer = new ResizeObserver(([entry]) => {
        if (entry) this.availableWidth.set(entry.contentRect.width);
      });
      zone.runOutsideAngular(() => observer.observe(root));
      onCleanup(() => observer.disconnect());
    });

    afterRenderEffect(() => {
      if (this.overflowActions().length === 0) this.closeMore();
    });
  }

  protected toggleMore(event?: Event): void {
    event?.stopPropagation();
    if (this.overflowActions().length === 0) return;
    const next = !this.open();
    this.open.set(next);
    this.moreOpenChange.emit(next);
  }

  protected closeMore(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.moreOpenChange.emit(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const trigger = this.moreTrigger()?.nativeElement;
    const target = event.target;
    if (trigger && target instanceof Node && trigger.contains(target)) return;
    this.closeMore();
  }

  protected runAction(action: AngularToolbarAction): void {
    if (action.href === undefined) action.onClick?.();
  }

  protected selectAction(action: AngularToolbarAction): void {
    if (action.disabled) return;
    this.runAction(action);
    this.closeMore();
  }

  protected readonly styles = createStyle(toolbarStyle, () => ({
    variant: this.variant(),
    color: this.color(),
    orientation: this.orientation(),
    accessibleLabel: this.accessibleLabel(),
    actions: this.actions(),
    maxVisible: this.maxVisible(),
    responsive: this.responsive(),
    itemWidth: this.itemWidth(),
    more: this.more(),
    morePosition: this.morePosition(),
    isOverflowOpen: this.open(),
    className: mergeClassNames<ToolbarInterface>(
      'toolbar',
      this.classes(),
      this.hostClass(),
    ),
  }));
}
