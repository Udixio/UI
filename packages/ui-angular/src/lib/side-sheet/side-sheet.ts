import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  untracked,
  viewChild,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import {
  sideSheetStyle,
  type ClassNameComponent,
  type SideSheetInterface,
  type SideSheetProps,
} from '@udixio/core';
import {
  createSideSheetController,
  createSideSheetTransitionController,
  type SideSheetController,
  type SideSheetTransitionController,
} from '@udixio/core/dom';
import { iClose } from '@udixio/icons-rounded-400/close';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import { Divider } from '../divider/divider';
import { IconButton } from '../icon-button/icon-button';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

let nextSideSheetId = 0;

/**
 * Side sheets show secondary content anchored to the side of the screen.
 *
 * @status beta
 * @category Layout
 * @devx
 * - `open` is controlled; `defaultOpen` initializes uncontrolled usage. Defaults to `true`.
 * - `variant="modal"` moves its host to `document.body` while connected, escaping any ancestor
 *   that would otherwise break `position: fixed`. Pass `container` to move it elsewhere instead
 *   (for example to confine a demo to a bounded box).
 * - `divider` is ignored for `variant="modal"`, which never renders one.
 * - The open/close width and backdrop transitions are implemented once with Motion JavaScript in
 *   `@udixio/core/dom`, so Angular and React share the same timing, reduced-motion behavior, and
 *   cleanup.
 * @a11y
 * - `variant="modal"` renders `role="dialog"` and `aria-modal`, traps focus by making every other
 *   `document.body` child `inert` while open, moves initial focus into the panel, closes on Escape,
 *   restores focus to the previously focused element on close, and locks body scroll.
 * - Whichever variant, the panel is `inert` and `aria-hidden` while closed, and reduced-motion
 *   preference keeps state changes immediate and fully perceivable.
 * - `variant="standard"` is persistent layout chrome: no dialog role, focus trap, or Escape handling.
 * - `title`, when provided, labels the panel through `aria-labelledby`.
 * @limitations
 * - Projected content stays mounted while closed, since the panel is always present for its
 *   open/close animation; expensive subtrees are not torn down until the `SideSheet` itself
 *   is destroyed.
 * - The open/close animation transitions `width`, not a transform, so it can be less smooth for a
 *   very large panel or on a low-powered device.
 */
@Component({
  selector: 'lib-side-sheet',
  standalone: true,
  imports: [IconButton, Divider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div #portalRoot style="display: contents">
      @if (isModal()) {
        <div
          #overlay
          [class]="styles()['overlay']"
          aria-hidden="true"
          [attr.inert]="!isOpen() ? '' : null"
          (click)="close()"
        ></div>
      }
      <div
        #panel
        [class]="styles()['sideSheet']"
        [attr.role]="isModal() ? 'dialog' : null"
        [attr.aria-modal]="isModal() ? 'true' : null"
        [attr.aria-labelledby]="title() ? titleId : null"
        [attr.aria-hidden]="!isOpen()"
        [attr.inert]="!isOpen() ? '' : null"
      >
        <div [class]="styles()['container']">
          <div [class]="styles()['header']">
            @if (title()) {
              <p [id]="titleId" [class]="styles()['title']">
                {{ title() }}
              </p>
            }
            <lib-icon-button
              size="small"
              [label]="closeLabel()"
              [icon]="closeIcon()"
              [className]="styles()['closeButton']"
              (click)="close()"
            />
          </div>
          <div [class]="styles()['content']">
            <ng-content />
          </div>
        </div>
        @if (showDivider()) {
          <lib-divider [class]="styles()['divider']" orientation="vertical" />
        }
      </div>
    </div>
  `,
})
export class SideSheet implements OnInit, OnDestroy {
  readonly variant = input<SideSheetProps['variant']>('standard');
  readonly title = input<SideSheetProps['title']>();
  readonly position = input<SideSheetProps['position']>('right');
  readonly open = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly defaultOpen = input(true, { transform: booleanAttribute });
  readonly closeIcon =
    input<NonNullable<SideSheetProps['closeIcon']>>(iClose);
  readonly divider = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  /** Classes or state-aware element classes applied through the shared style contract. */
  readonly className =
    input<string | ClassNameComponent<SideSheetInterface>>();
  /** Portal target for `variant="modal"`. Defaults to `document.body`. */
  readonly container = input<Element | null | undefined>(undefined);
  /** Motion transition shared by every framework for the open/close width and opacity animation. */
  readonly transition = input<SideSheetProps['transition']>();

  /** Emits an accepted open-state request and supports `[(open)]`. */
  readonly openChange = output<boolean>();

  private readonly openState = createControllableState({
    value: this.open,
    defaultValue: this.defaultOpen,
    onChange: (open) => this.openChange.emit(open),
    componentName: 'SideSheet',
    stateName: 'open',
  });

  protected readonly isOpen = this.openState.value;
  protected readonly isModal = computed(() => this.variant() === 'modal');
  protected readonly showDivider = computed(() =>
    this.isModal() ? false : (this.divider() ?? true),
  );
  protected readonly closeLabel = computed(() =>
    this.title() ? `Close ${this.title()}` : 'Close',
  );
  protected readonly styles = createStyle(sideSheetStyle, () => ({
    variant: this.variant(),
    title: this.title(),
    position: this.position(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    closeIcon: this.closeIcon(),
    divider: this.divider(),
    transition: this.transition(),
    isOpen: this.isOpen(),
    className: this.className(),
  }));

  protected readonly titleId = `side-sheet-title-${nextSideSheetId++}`;

  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly portalRoot =
    viewChild<ElementRef<HTMLElement>>('portalRoot');
  private readonly overlay = viewChild<ElementRef<HTMLElement>>('overlay');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  private originalParent: Node | null = null;
  private originalNextSibling: Node | null = null;
  private isPortaled = false;
  private portalTarget: Element | null = null;
  private controller?: SideSheetController;
  private transitionController?: SideSheetTransitionController;
  private hasAppliedInitialTransition = false;

  constructor() {
    afterRenderEffect(() => {
      const root = this.portalRoot()?.nativeElement;
      if (!root) return;
      const shouldPortal = this.isModal();
      const target = this.container() ?? this.document.body;
      if (shouldPortal && (!this.isPortaled || this.portalTarget !== target)) {
        if (!this.isPortaled) {
          this.originalParent = root.parentNode;
          this.originalNextSibling = root.nextSibling;
        }
        this.renderer.appendChild(target, root);
        this.isPortaled = true;
        this.portalTarget = target;
      } else if (!shouldPortal && this.isPortaled) {
        if (this.originalParent) {
          this.renderer.insertBefore(
            this.originalParent,
            root,
            this.originalNextSibling,
          );
        }
        this.isPortaled = false;
        this.portalTarget = null;
      }
    });

    afterRenderEffect((onCleanup) => {
      if (!this.isModal() || !this.isOpen()) return;
      const panel = this.panel()?.nativeElement;
      if (!panel) return;

      const controller = createSideSheetController({
        panel,
        overlay: this.overlay()?.nativeElement,
        container: this.container() ?? this.document.body,
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

    afterRenderEffect((onCleanup) => {
      const panel = this.panel()?.nativeElement;
      if (!panel) return;

      const controller = createSideSheetTransitionController({
        container: panel,
        overlay: this.overlay()?.nativeElement,
        transition: this.transition(),
      });
      this.transitionController = controller;
      controller.setOpen(untracked(this.isOpen), true);
      onCleanup(() => {
        controller.destroy();
        if (this.transitionController === controller) {
          this.transitionController = undefined;
        }
      });
    });

    afterRenderEffect(() => {
      const isOpen = this.isOpen();
      if (!this.hasAppliedInitialTransition) {
        this.hasAppliedInitialTransition = true;
        return;
      }
      this.transitionController?.setOpen(isOpen);
    });
  }

  ngOnInit(): void {
    this.openState.initialize();
  }

  ngOnDestroy(): void {
    const root = this.portalRoot()?.nativeElement;
    if (this.isPortaled && root) {
      root.remove();
    }
  }

  protected close(): void {
    this.openState.set(false);
  }
}
