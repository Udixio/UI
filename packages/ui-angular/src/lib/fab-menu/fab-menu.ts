import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  output,
  viewChild,
  type OnInit,
} from '@angular/core';
import {
  DEFAULT_FAB_MENU_CLOSE_ICON,
  fabMenuStyle,
  type ClassNameComponent,
  type ButtonInterface,
  type FabMenuAction,
  type FabMenuInterface,
  type FabMenuProps,
} from '@udixio/core';
import {
  createFabMenuController,
  type FabMenuController,
} from '@udixio/core/dom';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import { Fab } from '../fab/fab';
import { Button } from '../button/button';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

export interface FabMenuActionSelectEvent {
  action: FabMenuAction;
  index: number;
}

/**
 * FabMenu exposes related primary actions from one toggleable FAB.
 *
 * @status stable
 * @category Action
 * @devx
 * - Uses the framework-independent `actions` input.
 * - `open` is controlled; `defaultOpen` initializes uncontrolled usage.
 * - Opening contracts every trigger size to a medium icon-only close control while preserving the closed footprint.
 * - Action choreography is implemented once with Motion JavaScript in `@udixio/core/dom`.
 * @a11y
 * - The trigger exposes `aria-expanded`/`aria-controls`.
 * - Opening focuses the first enabled action; Escape closes and restores trigger focus.
 * - Outside press and selection close the action group.
 * - Reduced-motion preference keeps state changes immediate and fully perceivable.
 * @limitations
 * - Consumers own action-specific side effects through the `actionSelect` output.
 */
@Component({
  selector: 'udx-fab-menu',
  standalone: true,
  imports: [Fab, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div
      #root
      [class]="styles()['fabMenu']"
      [hidden]="!hasAccessibleLabel()"
      [attr.aria-hidden]="!hasAccessibleLabel() || null"
      [attr.data-open]="isOpen()"
    >
      <span [class]="styles()['triggerSizer']" aria-hidden="true" inert>
        <udx-fab
          [label]="label()"
          [icon]="icon()"
          [variant]="closedTriggerVariant()"
          [size]="size()"
          [extended]="extended()"
          disabled
          [tabIndex]="-1"
        />
      </span>

      <span #triggerHost [class]="styles()['triggerPositioner']">
        <udx-fab
          [label]="resolvedTriggerLabel()"
          [icon]="resolvedTriggerIcon()"
          [variant]="triggerVariant()"
          [size]="isOpen() ? 'medium' : size()"
          [extended]="extended() && !isOpen()"
          [disabled]="disabled() || !hasAccessibleLabel()"
          [className]="styles()['fab']"
          [aria-expanded]="isOpen()"
          [aria-controls]="panelId()"
          (click)="toggle()"
        />
      </span>

      <div
        #panel
        [id]="panelId()"
        [class]="styles()['actions']"
        role="group"
        [attr.aria-label]="resolvedActionsLabel()"
        [attr.aria-hidden]="!isOpen() || null"
        [attr.inert]="!isOpen() ? '' : null"
      >
        @for (action of actions(); track action.id; let index = $index) {
          <span [class]="styles()['actionContainer']" data-fab-menu-action>
            <udx-button
              [label]="action.label"
              [icon]="action.icon"
              [href]="action.href"
              [disabled]="disabled() || !!action.disabled"
              variant="filled"
              shape="rounded"
              [className]="actionClassName"
              (click)="selectAction(action, index)"
            />
          </span>
        }
      </div>
    </div>
  `,
})
export class FabMenu implements OnInit {
  readonly label = input.required<string>();
  readonly icon = input.required<FabMenuProps['icon']>();
  readonly actions = input.required<readonly FabMenuAction[]>();
  readonly closeIcon = input<FabMenuProps['closeIcon']>();
  readonly closeLabel = input<string>();
  readonly actionsLabel = input<string>();
  readonly variant = input<FabMenuProps['variant']>('primary');
  readonly size = input<FabMenuProps['size']>('medium');
  readonly extended = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly open = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Classes or state-aware element classes applied through the shared style contract. */
  readonly className = input<string | ClassNameComponent<FabMenuInterface>>();

  /** Emits an accepted open-state request and supports `[(open)]`. */
  readonly openChange = output<boolean>();
  /** Emits the selected action and its source index before closing. */
  readonly actionSelect = output<FabMenuActionSelectEvent>();

  private readonly openState = createControllableState({
    value: this.open,
    defaultValue: this.defaultOpen,
    onChange: (open) => this.openChange.emit(open),
    componentName: 'FabMenu',
    stateName: 'open',
  });
  protected readonly isOpen = this.openState.value;
  protected readonly hasAccessibleLabel = computed(
    () => this.label().trim() !== '',
  );
  protected readonly resolvedTriggerLabel = computed(() =>
    this.isOpen()
      ? (this.closeLabel() ?? `Close ${this.label()}`)
      : this.label(),
  );
  protected readonly resolvedTriggerIcon = computed(
    () =>
      (this.isOpen() && this.closeIcon()) ||
      (this.isOpen() ? DEFAULT_FAB_MENU_CLOSE_ICON : this.icon()),
  );
  protected readonly resolvedActionsLabel = computed(
    () => this.actionsLabel() ?? `${this.label()} actions`,
  );
  protected readonly triggerVariant = computed(
    () =>
      (this.isOpen() ? this.variant() : `${this.variant()}Container`) as
        | 'primary'
        | 'secondary'
        | 'tertiary'
        | 'primaryContainer'
        | 'secondaryContainer'
        | 'tertiaryContainer',
  );
  protected readonly closedTriggerVariant = computed(
    () =>
      `${this.variant()}Container` as
        | 'primaryContainer'
        | 'secondaryContainer'
        | 'tertiaryContainer',
  );
  protected readonly panelId = computed(() => `fab-menu-${this.instanceId}`);
  protected readonly styles = createStyle(fabMenuStyle, () => ({
    label: this.label(),
    icon: this.icon(),
    actions: this.actions(),
    closeIcon: this.closeIcon(),
    closeLabel: this.closeLabel(),
    actionsLabel: this.actionsLabel(),
    variant: this.variant(),
    size: this.size(),
    extended: this.extended(),
    disabled: this.disabled(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    isOpen: this.isOpen(),
    className: this.className(),
  }));

  private static nextId = 0;
  private readonly instanceId = FabMenu.nextId++;
  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
  private readonly triggerHost =
    viewChild<ElementRef<HTMLElement>>('triggerHost');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private controller?: FabMenuController;

  constructor() {
    afterRenderEffect((onCleanup) => {
      const root = this.root()?.nativeElement;
      const trigger =
        this.triggerHost()?.nativeElement.querySelector<HTMLElement>(
          'button, a',
        );
      const panel = this.panel()?.nativeElement;
      if (!root || !trigger || !panel) return;

      const controller = createFabMenuController({
        root,
        trigger,
        panel,
        onDismiss: () => this.openState.set(false),
      });
      this.controller = controller;
      onCleanup(() => {
        controller.destroy();
        if (this.controller === controller) {
          this.controller = undefined;
        }
      });
    });

    afterRenderEffect(() => {
      this.controller?.setOpen(this.isOpen());
    });
  }

  ngOnInit(): void {
    this.openState.initialize();
  }

  protected readonly actionClassName: ClassNameComponent<ButtonInterface> =
    () => ({
      button: this.styles()['action'],
      stateLayer: this.styles()['actionStateLayer'],
    });

  protected toggle(): void {
    if (!this.disabled() && this.hasAccessibleLabel()) {
      this.openState.set(!this.isOpen());
    }
  }

  protected selectAction(action: FabMenuAction, index: number): void {
    if (this.disabled() || action.disabled) return;
    this.actionSelect.emit({ action, index });
    this.controller?.restoreFocusOnClose();
    this.openState.set(false);
  }
}
