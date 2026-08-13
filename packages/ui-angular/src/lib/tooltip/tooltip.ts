import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
  untracked,
  viewChild,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import {
  resolveTooltipInteraction,
  TOOLTIP_LONG_PRESS_DELAY,
  TOOLTIP_TOUCH_HIDE_DELAY,
  TOOLTIP_TOUCH_MOVE_TOLERANCE,
  tooltipStyle,
  type ClassNameComponent,
  type TooltipInteractionEvent,
  type TooltipInteractionState,
  type TooltipInterface,
  type TooltipProps,
  type TooltipTriggerKind,
} from '@udixio/core';
import {
  addPointerEnterLeaveListener,
  claimTooltipVisibility,
  createTooltipTransitionController,
  listenForTooltipVisibilityClaims,
  type TooltipTransitionController,
} from '@udixio/core/dom';
import { createStyle } from '../utils/create-style';
import { AnchorPositioner } from '../anchor-positioner/anchor-positioner';
import { Button } from '../button/button';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

export interface TooltipButtonAction {
  label: string;
  onClick?: () => void;
}

let nextTooltipId = 0;

/**
 * Tooltips display brief labels or messages.
 *
 * Unlike React, which can clone an arbitrary projected child to attach
 * trigger handlers to it, Angular has no equivalent primitive: `target`
 * is therefore always required, mirroring React's `targetRef` mode. There
 * is no `children`-wrapping convenience mode.
 *
 * @status beta
 * @category Communication
 * @devx
 * - `target` is required and points at the trigger element -- including a
 *   `display: contents` component host (`Button`, `IconButton`, `Chip`, ...):
 *   hover is detected via bubbling `mouseover`/`mouseout`, not `mouseenter`/
 *   `mouseleave`, specifically so it keeps working through such a host.
 * - Provide `title`/`text`/`buttons`, or project custom content instead --
 *   projected content is only rendered when none of those three are set.
 * - Supports controlled `open` plus `openDelay`/`closeDelay`.
 * - A touch long press opens after 500ms and remains visible for 1.5s after
 *   release, following Material 3 guidance.
 * - Opening one tooltip closes the currently visible tooltip in the document.
 * - The open/close opacity/height transition is implemented once with
 *   Anime.js in `@udixio/core/dom`, so Angular and React share the same
 *   timing, reduced-motion behavior, and cleanup. No framework-specific
 *   animation library is used.
 * - The tooltip surface stays mounted at all times (hidden via `inert` and
 *   `aria-hidden`) rather than mounting only while open, so it can animate
 *   out; expensive projected content is not torn down until `Tooltip`
 *   itself is destroyed.
 * @a11y
 * - Provides `role="tooltip"` and `aria-describedby` on `target` when open.
 * @limitations
 * - Projected content stays mounted while closed, since the surface is
 *   always present for its open/close animation; expensive content is not
 *   torn down until `Tooltip` itself is destroyed.
 * - `position` falls back to tracking `getBoundingClientRect()` on scroll and
 *   resize in browsers without native CSS Anchor Positioning support.
 */
@Component({
  selector: 'udx-tooltip',
  standalone: true,
  imports: [AnchorPositioner, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <udx-anchor-positioner [anchor]="target()" [position]="effectivePosition()">
      <div
        #surface
        [id]="tooltipId()"
        role="tooltip"
        [attr.aria-hidden]="!resolvedOpen()"
        [attr.inert]="!resolvedOpen() ? '' : null"
        [class]="styles()['toolTip']"
        style="opacity: 0"
        (mouseenter)="handleSurfaceEnter()"
        (mouseleave)="handleSurfaceLeave()"
      >
        <div [class]="styles()['container']">
          @if (useDefaultLayout()) {
            @if (title()) {
              <div [class]="styles()['subHead']">{{ title() }}</div>
            }
            @if (text()) {
              <div [class]="styles()['supportingText']">{{ text() }}</div>
            }
            @if (buttonList().length) {
              <div [class]="styles()['actions']">
                @for (button of buttonList(); track button.label) {
                  <udx-button
                    size="small"
                    variant="text"
                    [label]="button.label"
                    (click)="button.onClick?.()"
                  />
                }
              </div>
            }
          } @else {
            <div [class]="styles()['content']">
              <ng-content />
            </div>
          }
        </div>
      </div>
    </udx-anchor-positioner>
  `,
})
export class Tooltip implements OnInit, OnDestroy {
  /** The element the tooltip is triggered by and positioned against. */
  readonly target = input.required<ElementRef<HTMLElement> | HTMLElement>();
  /** `'plain'` is a small text bubble; `'rich'` is a card-like surface with title/text/actions. */
  readonly variant = input<TooltipProps['variant']>('plain');
  /** Headline of a rich tooltip. */
  readonly title = input<TooltipProps['title']>();
  /** Supporting text for the tooltip. */
  readonly text = input<TooltipProps['text']>();
  /** Placement relative to the target. Defaults to `bottom-right` for `variant="rich"`, `bottom` otherwise. */
  readonly position = input<TooltipProps['position']>();
  /** Interaction(s) that open the tooltip. */
  readonly trigger = input<TooltipProps['trigger']>(['hover', 'focus']);
  /** Whether the open tooltip describes its target through `aria-describedby`. */
  readonly describeTarget = input(true, { transform: booleanAttribute });
  /** Delay in milliseconds before showing the tooltip. Default: 400ms */
  readonly openDelay = input(400);
  /** Delay in milliseconds before hiding the tooltip. Default: 150ms */
  readonly closeDelay = input(150);
  readonly open = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Custom ID for accessibility linking. Auto-generated if not provided. */
  readonly id = input<string>();
  /** Small text-variant action button(s) rendered in the built-in rich layout. */
  readonly buttons = input<TooltipButtonAction | TooltipButtonAction[]>();
  /** Anime.js opacity/scale open-close timing, shared by every framework. */
  readonly transition = input<TooltipProps['transition']>();
  /** Classes or state-aware element classes applied through the shared style contract. */
  readonly className = input<string | ClassNameComponent<TooltipInterface>>();

  /** Emits an accepted open-state request and supports `[(open)]`. */
  readonly openChange = output<boolean>();

  private readonly generatedId = `tooltip-${nextTooltipId++}`;
  protected readonly tooltipId = computed(() => this.id() ?? this.generatedId);

  protected readonly effectivePosition = computed(
    () =>
      this.position() ??
      (this.variant() === 'rich' ? 'bottom-right' : 'bottom'),
  );
  protected readonly buttonList = computed<TooltipButtonAction[]>(() => {
    const value = this.buttons();
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });
  protected readonly useDefaultLayout = computed(
    () => !!(this.title() || this.text() || this.buttonList().length),
  );

  private readonly triggers = computed<TooltipTriggerKind[]>(() => {
    const value = this.trigger();
    const list = Array.isArray(value) ? value : [value];
    return list.filter((item): item is TooltipTriggerKind => item != null);
  });
  private readonly isControlled = computed(() => this.open() !== undefined);
  private readonly interactionState = signal<TooltipInteractionState>('hidden');
  private readonly suppressedByPeer = signal(false);
  private isSurfaceHovered = false;
  private openTimer?: ReturnType<typeof setTimeout>;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private touchPointer?: { id: number; x: number; y: number };
  private touchLongPressOpened = false;
  private suppressTouchCompatibilityEvents = false;
  private compatibilityTimer?: ReturnType<typeof setTimeout>;

  protected readonly resolvedState = computed<TooltipInteractionState>(() =>
    this.isControlled()
      ? this.open()
        ? 'hovered'
        : 'hidden'
      : this.interactionState(),
  );
  private readonly stateOpen = computed(
    () => this.resolvedState() !== 'hidden',
  );
  protected readonly resolvedOpen = computed(
    () => this.stateOpen() && !this.suppressedByPeer(),
  );

  protected readonly styles = createStyle(tooltipStyle, () => ({
    variant: this.variant(),
    title: this.title(),
    text: this.text(),
    position: this.effectivePosition(),
    trigger: this.trigger(),
    describeTarget: this.describeTarget(),
    openDelay: this.openDelay(),
    closeDelay: this.closeDelay(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    id: this.id(),
    transition: this.transition(),
    isOpen: this.resolvedOpen(),
    className: this.className(),
  }));

  private readonly surface = viewChild<ElementRef<HTMLDivElement>>('surface');
  private transitionController?: TooltipTransitionController;
  private hasAppliedInitialTransition = false;

  constructor() {
    afterRenderEffect((onCleanup) => {
      const target = this.resolveElement(this.target());
      if (!target) return;
      const ownerDocument = target.ownerDocument;
      const removeListener = listenForTooltipVisibilityClaims(
        ownerDocument,
        this.tooltipId(),
        () => {
          if (!untracked(this.stateOpen) || untracked(this.suppressedByPeer)) {
            return;
          }
          this.suppressedByPeer.set(true);
          if (!untracked(this.isControlled)) {
            this.interactionState.set('hidden');
          }
          this.openChange.emit(false);
        },
      );
      if (this.resolvedOpen()) {
        claimTooltipVisibility(ownerDocument, this.tooltipId());
      }
      onCleanup(removeListener);
    });

    afterRenderEffect((onCleanup) => {
      const targetInput = this.target();
      const target = this.resolveElement(targetInput);
      if (!target) return;

      const onMouseEnter = () => {
        if (!this.suppressTouchCompatibilityEvents) {
          this.request('pointerEnter', untracked(this.openDelay));
        }
      };
      const onMouseLeave = () => {
        if (!this.suppressTouchCompatibilityEvents) {
          if (this.openTimer) {
            clearTimeout(this.openTimer);
            this.openTimer = undefined;
          }
          this.request('pointerLeave', untracked(this.closeDelay));
        }
      };
      const removeHoverListener = addPointerEnterLeaveListener(target, {
        onEnter: onMouseEnter,
        onLeave: onMouseLeave,
      });
      const onFocus = () => {
        if (!this.suppressTouchCompatibilityEvents) this.request('focus');
      };
      const onBlur = () => {
        const next = resolveTooltipInteraction(
          {
            state: untracked(this.resolvedState),
            triggers: untracked(this.triggers),
            isSurfaceHovered: this.isSurfaceHovered,
          },
          'blur',
        );
        if (next === null) return;
        this.clearTimers();
        if (next === 'hidden') {
          this.closeTimer = setTimeout(
            () => this.commit(next),
            untracked(this.closeDelay),
          );
        } else {
          this.commit(next);
        }
      };
      const onClick = () => {
        if (!this.touchLongPressOpened) this.request('click');
      };
      const onPointerDown = (event: PointerEvent) =>
        this.handlePointerDown(event);
      const onPointerMove = (event: PointerEvent) =>
        this.handlePointerMove(event);
      const onPointerUp = (event: PointerEvent) => this.finishTouch(event);
      const onPointerCancel = (event: PointerEvent) => this.finishTouch(event);
      const onContextMenu = (event: MouseEvent) => {
        if (this.touchPointer || this.touchLongPressOpened) {
          event.preventDefault();
        }
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && untracked(this.resolvedOpen)) {
          this.request('escape');
          event.preventDefault();
        }
      };

      target.addEventListener('focus', onFocus, true);
      target.addEventListener('blur', onBlur, true);
      target.addEventListener('click', onClick);
      target.addEventListener('keydown', onKeyDown);
      target.addEventListener('pointerdown', onPointerDown);
      target.addEventListener('pointermove', onPointerMove);
      target.addEventListener('pointerup', onPointerUp);
      target.addEventListener('pointercancel', onPointerCancel);
      target.addEventListener('contextmenu', onContextMenu);

      onCleanup(() => {
        removeHoverListener();
        target.removeEventListener('focus', onFocus, true);
        target.removeEventListener('blur', onBlur, true);
        target.removeEventListener('click', onClick);
        target.removeEventListener('keydown', onKeyDown);
        target.removeEventListener('pointerdown', onPointerDown);
        target.removeEventListener('pointermove', onPointerMove);
        target.removeEventListener('pointerup', onPointerUp);
        target.removeEventListener('pointercancel', onPointerCancel);
        target.removeEventListener('contextmenu', onContextMenu);
      });
    });

    afterRenderEffect((onCleanup) => {
      const target = this.resolveElement(this.target());
      if (!target || !this.describeTarget()) return;
      this.updateTargetDescription(target, this.resolvedOpen());
      onCleanup(() => this.updateTargetDescription(target, false));
    });

    afterRenderEffect((onCleanup) => {
      const surface = this.surface()?.nativeElement;
      if (!surface) return;

      const controller = createTooltipTransitionController({
        element: surface,
        transition: untracked(this.transition),
      });
      this.transitionController = controller;
      controller.setOpen(untracked(this.resolvedOpen), true);
      this.hasAppliedInitialTransition = false;
      onCleanup(() => {
        controller.destroy();
        if (this.transitionController === controller) {
          this.transitionController = undefined;
        }
      });
    });

    afterRenderEffect(() => {
      const isOpen = this.resolvedOpen();
      if (!this.hasAppliedInitialTransition) {
        this.hasAppliedInitialTransition = true;
        return;
      }
      this.transitionController?.setOpen(isOpen);
    });
  }

  ngOnInit(): void {
    if (!this.isControlled()) {
      this.interactionState.set(this.defaultOpen() ? 'hovered' : 'hidden');
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  protected handleSurfaceEnter(): void {
    this.isSurfaceHovered = true;
    this.clearTimers();
  }

  protected handleSurfaceLeave(): void {
    this.isSurfaceHovered = false;
    this.request('surfaceLeave', untracked(this.closeDelay));
  }

  private resolveElement(
    value: ElementRef<HTMLElement> | HTMLElement,
  ): HTMLElement | null {
    return value instanceof ElementRef ? value.nativeElement : value;
  }

  private updateTargetDescription(
    target: HTMLElement,
    includeTooltip: boolean,
  ): void {
    const tooltipId = this.tooltipId();
    const ids = (target.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((value) => value && value !== tooltipId);
    if (includeTooltip) ids.push(tooltipId);
    if (ids.length) {
      target.setAttribute('aria-describedby', ids.join(' '));
    } else {
      target.removeAttribute('aria-describedby');
    }
  }

  private clearTimers(): void {
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = undefined;
    }
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
    if (this.compatibilityTimer) {
      clearTimeout(this.compatibilityTimer);
      this.compatibilityTimer = undefined;
    }
  }

  private handlePointerDown(event: PointerEvent): void {
    if (
      event.pointerType !== 'touch' ||
      !untracked(this.triggers).includes('hover')
    ) {
      return;
    }
    this.clearTimers();
    this.touchPointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    this.touchLongPressOpened = false;
    this.suppressTouchCompatibilityEvents = true;
    this.openTimer = setTimeout(() => {
      this.touchLongPressOpened = true;
      this.commit('hovered');
    }, TOOLTIP_LONG_PRESS_DELAY);
  }

  private handlePointerMove(event: PointerEvent): void {
    const touch = this.touchPointer;
    if (
      !touch ||
      touch.id !== event.pointerId ||
      this.touchLongPressOpened ||
      Math.hypot(event.clientX - touch.x, event.clientY - touch.y) <=
        TOOLTIP_TOUCH_MOVE_TOLERANCE
    ) {
      return;
    }
    this.touchPointer = undefined;
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = undefined;
    }
    this.compatibilityTimer = setTimeout(() => {
      this.suppressTouchCompatibilityEvents = false;
    }, 0);
  }

  private finishTouch(event: PointerEvent): void {
    if (this.touchPointer?.id !== event.pointerId) return;
    this.touchPointer = undefined;
    if (this.openTimer) {
      clearTimeout(this.openTimer);
      this.openTimer = undefined;
    }
    if (this.touchLongPressOpened) {
      if (this.closeTimer) clearTimeout(this.closeTimer);
      this.closeTimer = setTimeout(() => {
        this.touchLongPressOpened = false;
        this.suppressTouchCompatibilityEvents = false;
        this.commit('hidden');
      }, TOOLTIP_TOUCH_HIDE_DELAY);
    } else {
      this.compatibilityTimer = setTimeout(() => {
        this.suppressTouchCompatibilityEvents = false;
      }, 0);
    }
  }

  private commit(next: TooltipInteractionState): void {
    if (!untracked(this.isControlled)) {
      this.interactionState.set(next);
    }
    if (next !== 'hidden') {
      this.suppressedByPeer.set(false);
      const target = this.resolveElement(this.target());
      if (target) {
        claimTooltipVisibility(target.ownerDocument, this.tooltipId());
      }
    }
    this.openChange.emit(next !== 'hidden');
  }

  private request(event: TooltipInteractionEvent, delayMs = 0): void {
    const next = resolveTooltipInteraction(
      {
        state: untracked(this.resolvedState),
        triggers: untracked(this.triggers),
        isSurfaceHovered: this.isSurfaceHovered,
      },
      event,
    );
    if (next === null) return;
    this.clearTimers();
    if (delayMs > 0) {
      const timer = setTimeout(() => this.commit(next), delayMs);
      if (next === 'hidden') {
        this.closeTimer = timer;
      } else {
        this.openTimer = timer;
      }
    } else {
      this.commit(next);
    }
  }
}
