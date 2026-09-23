import {
  Directive,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  type ComponentRef,
  type OnDestroy,
} from '@angular/core';
import {
  tooltipStyle,
  type AnchorPositionAxis,
  type ClassNameComponent,
  type ElementClasses,
  type TooltipInteractionState,
  type TooltipInterface,
  type TooltipProps,
  type TooltipTriggerKind,
} from '@udixio/core';
import {
  createTooltipTransitionController,
  createTooltipTriggerController,
  type TooltipTransitionController,
  type TooltipTriggerController,
} from '@udixio/core/dom';
import { createStyle } from '../utils/create-style';
import { TooltipSurface, type TooltipButtonAction } from './tooltip-surface';

export type { TooltipButtonAction } from './tooltip-surface';

const optionalBooleanAttribute = (value: unknown): boolean | undefined =>
  value === undefined ? undefined : booleanAttribute(value);

let nextTooltipId = 0;

/**
 * Tooltips display brief labels or messages.
 *
 * @status beta
 * @category Communication
 * @devx
 * - Put it on the trigger: `<udx-button udxTooltip="Copy" />`. Inputs are
 *   prefixed `udxTooltip*` because the host element is not the directive's own;
 *   the member names stay the shared contract's vocabulary.
 * - Content comes from `udxTooltip` (the supporting text), `udxTooltipTitle`
 *   and `udxTooltipButtons`, or from a `TemplateRef` on `udxTooltipContent`.
 *   Any one of the three activates the directive, so a title-only or
 *   template-only tooltip needs no placeholder text; the rest only configure
 *   an already-active directive.
 * - Supports controlled `udxTooltipOpen` plus the two delays.
 * - A touch long press opens after 500ms and stays visible for 1.5s after
 *   release, following Material 3 guidance.
 * - Opening one tooltip closes the currently visible tooltip in the document.
 * - Timing, reduced-motion behaviour and interruption match React exactly:
 *   both adapters drive the same controllers in `@udixio/core/dom`.
 * @a11y
 * - Provides `role="tooltip"` on the panel and `aria-describedby` on the host
 *   while open.
 * @limitations
 * - The panel stays mounted while closed so it can animate out; expensive
 *   `udxTooltipContent` is not torn down until the directive is destroyed.
 * - `udxTooltipPosition` falls back to tracking `getBoundingClientRect()` on
 *   scroll and resize where CSS Anchor Positioning is unavailable.
 */
// Any of the three content-bearing attributes activates the directive. Binding
// only `udxTooltipContent` or only `udxTooltipTitle` is a legitimate way to use
// it, and neither should require a dummy `udxTooltip` to switch it on.
@Directive({
  selector: '[udxTooltip], [udxTooltipTitle], [udxTooltipContent]',
  standalone: true,
})
export class Tooltip implements OnDestroy {
  /** Supporting text. The directive's own binding carries it. */
  readonly text = input<TooltipProps['text']>(undefined, {
    alias: 'udxTooltip',
  });
  /** Headline of a rich tooltip. */
  readonly title = input<TooltipProps['title']>(undefined, {
    alias: 'udxTooltipTitle',
  });
  /** `'plain'` is a small text bubble; `'rich'` is a card-like surface. */
  readonly variant = input<TooltipProps['variant']>('plain', {
    alias: 'udxTooltipVariant',
  });
  /** Placement relative to the host. Defaults to `bottom-right` for `rich`. */
  readonly position = input<TooltipProps['position']>(undefined, {
    alias: 'udxTooltipPosition',
  });
  /** Axis used when `udxTooltipPosition="auto"`. Toolbar descendants derive it from their orientation. */
  readonly autoAxis = input<TooltipProps['autoAxis']>(undefined, {
    alias: 'udxTooltipAutoAxis',
  });
  /** Interaction(s) that open the tooltip. */
  readonly trigger = input<TooltipProps['trigger']>(['hover', 'focus'], {
    alias: 'udxTooltipTrigger',
  });
  /** Whether the open tooltip describes its host through `aria-describedby`. */
  readonly describeTarget = input(true, {
    alias: 'udxTooltipDescribeTarget',
    transform: booleanAttribute,
  });
  /** Delay in milliseconds before showing the tooltip. Default: 400ms */
  readonly openDelay = input(400, { alias: 'udxTooltipOpenDelay' });
  /** Delay in milliseconds before hiding the tooltip. Default: 150ms */
  readonly closeDelay = input(150, { alias: 'udxTooltipCloseDelay' });
  /** Controlled open state. Leave unset to let the directive own it. */
  readonly open = input<boolean | undefined, unknown>(undefined, {
    alias: 'udxTooltipOpen',
    transform: optionalBooleanAttribute,
  });
  readonly defaultOpen = input(false, {
    alias: 'udxTooltipDefaultOpen',
    transform: booleanAttribute,
  });
  /** Custom ID for accessibility linking. Auto-generated if not provided. */
  readonly tooltipId = input<string | undefined>(undefined, {
    alias: 'udxTooltipId',
  });
  /** Small text-variant action button(s) in the built-in rich layout. */
  readonly buttons = input<TooltipButtonAction | TooltipButtonAction[]>(
    undefined,
    { alias: 'udxTooltipButtons' },
  );
  /** Custom content, replacing title/text/buttons when provided. */
  readonly content = input<TemplateRef<unknown> | undefined>(undefined, {
    alias: 'udxTooltipContent',
  });
  /** Anchor used for positioning. Defaults to the host element. */
  readonly anchor = input<ElementRef<HTMLElement> | HTMLElement | undefined>(
    undefined,
    { alias: 'udxTooltipAnchor' },
  );
  /** Anime.js opacity/scale open-close timing, shared by every framework. */
  readonly transition = input<TooltipProps['transition']>(undefined, {
    alias: 'udxTooltipTransition',
  });
  /** Classes for the detached surface: a root string, static element classes, or a state-aware function. */
  readonly classes = input<
    | string
    | ElementClasses<TooltipInterface>
    | ClassNameComponent<TooltipInterface>
    | undefined
  >(undefined, { alias: 'udxTooltipClass' });

  /** Emits an accepted open-state request. */
  readonly openChange = output<boolean>({ alias: 'udxTooltipOpenChange' });

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly generatedId = `tooltip-${nextTooltipId++}`;
  protected readonly resolvedId = computed(
    () => this.tooltipId() ?? this.generatedId,
  );
  private readonly toolbarAutoAxis = computed<AnchorPositionAxis | undefined>(
    () => {
      const orientation = (this.host.nativeElement as HTMLElement)
        .closest('[data-udx-toolbar-orientation]')
        ?.getAttribute('data-udx-toolbar-orientation');
      return orientation === 'vertical'
        ? 'horizontal'
        : orientation === 'horizontal'
          ? 'vertical'
          : undefined;
    },
  );
  private readonly effectivePosition = computed(
    () =>
      this.position() ??
      (this.toolbarAutoAxis()
        ? 'auto'
        : this.variant() === 'rich'
          ? 'bottom-right'
          : 'bottom'),
  );
  private readonly effectiveAutoAxis = computed(
    () => this.autoAxis() ?? this.toolbarAutoAxis() ?? 'vertical',
  );

  private readonly interactionState = signal<TooltipInteractionState>('hidden');
  private readonly suppressedByPeer = signal(false);
  private readonly isControlled = computed(() => this.open() !== undefined);
  private readonly resolvedState = computed<TooltipInteractionState>(() =>
    this.isControlled()
      ? this.open()
        ? 'hovered'
        : 'hidden'
      : this.interactionState(),
  );
  protected readonly resolvedOpen = computed(
    () => this.resolvedState() !== 'hidden' && !this.suppressedByPeer(),
  );

  /**
   * A directive is instantiated as soon as its attribute is present, even when
   * the binding resolves to nothing. With no text, title, buttons or template
   * there is nothing to show, so no panel is created and no listener attached.
   */
  private readonly hasContent = computed(
    () =>
      !!(
        this.text() ||
        this.title() ||
        this.content() ||
        (() => {
          const buttons = this.buttons();
          return Array.isArray(buttons) ? buttons.length > 0 : !!buttons;
        })()
      ),
  );

  protected readonly styles = createStyle(tooltipStyle, () => ({
    variant: this.variant(),
    title: this.title(),
    text: this.text(),
    position: this.effectivePosition(),
    autoAxis: this.effectiveAutoAxis(),
    trigger: this.trigger(),
    describeTarget: this.describeTarget(),
    openDelay: this.openDelay(),
    closeDelay: this.closeDelay(),
    open: this.open(),
    defaultOpen: this.defaultOpen(),
    id: this.tooltipId(),
    transition: this.transition(),
    isOpen: this.resolvedOpen(),
    className: this.classes(),
  }));

  private surfaceRef?: ComponentRef<TooltipSurface>;
  private triggerController?: TooltipTriggerController;
  private transitionController?: TooltipTransitionController;
  private hasAppliedInitialTransition = false;

  constructor() {
    // Keep the panel's inputs in step with the directive's own, creating it on
    // the first render that actually has something to show.
    effect(() => {
      if (!this.hasContent()) {
        this.destroySurface();
        return;
      }
      const surface = (this.surfaceRef ??= this.createSurface());
      surface.setInput('anchor', this.anchor() ?? this.host.nativeElement);
      surface.setInput('surfaceId', this.resolvedId());
      surface.setInput('position', this.effectivePosition());
      surface.setInput('autoAxis', this.effectiveAutoAxis());
      surface.setInput('title', this.title());
      surface.setInput('text', this.text());
      surface.setInput('buttons', this.buttons());
      surface.setInput('content', this.content());
      surface.setInput('isOpen', this.resolvedOpen());
      surface.setInput('styles', this.styles());
      surface.changeDetectorRef.detectChanges();
    });

    afterRenderEffect((onCleanup) => {
      if (!this.hasContent()) return;
      const controller = createTooltipTriggerController({
        target: this.host.nativeElement,
        tooltipId: untracked(this.resolvedId),
        triggers: () => {
          const value = this.trigger();
          const list = Array.isArray(value) ? value : [value];
          return list.filter(
            (item): item is TooltipTriggerKind => item != null,
          );
        },
        openDelay: () => untracked(this.openDelay),
        closeDelay: () => untracked(this.closeDelay),
        describeTarget: () => untracked(this.describeTarget),
        isControlled: () => untracked(this.isControlled),
        onStateChange: (next, suppressed) => {
          if (!untracked(this.isControlled)) this.interactionState.set(next);
          this.suppressedByPeer.set(suppressed);
          this.openChange.emit(next !== 'hidden');
        },
      });
      this.triggerController = controller;
      if (untracked(this.defaultOpen) && !untracked(this.isControlled)) {
        this.interactionState.set('hovered');
      }
      onCleanup(() => {
        controller.destroy();
        if (this.triggerController === controller) {
          this.triggerController = undefined;
        }
      });
    });

    // Mirror the resolved state back into the machine: controlled, this is how
    // it learns the owner's answer; uncontrolled it echoes its own decision.
    effect(() => {
      const state = this.resolvedState();
      this.triggerController?.setControlledState(state);
    });

    afterRenderEffect((onCleanup) => {
      const element = this.surfaceRef?.instance.surfaceElement()?.nativeElement;
      if (!element) return;
      const controller = createTooltipTransitionController({
        element,
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

  private createSurface(): ComponentRef<TooltipSurface> {
    const surface = this.viewContainer.createComponent(TooltipSurface);
    surface.setInput('anchor', this.host.nativeElement);
    surface.setInput('surfaceId', untracked(this.resolvedId));
    surface.setInput('autoAxis', untracked(this.effectiveAutoAxis));
    surface.setInput('styles', untracked(this.styles));
    surface.instance.surfaceHovered.subscribe((hovered: boolean) =>
      this.triggerController?.setSurfaceHovered(hovered),
    );
    return surface;
  }

  private destroySurface(): void {
    this.transitionController?.destroy();
    this.transitionController = undefined;
    this.surfaceRef?.destroy();
    this.surfaceRef = undefined;
  }

  ngOnDestroy(): void {
    this.destroySurface();
  }
}
