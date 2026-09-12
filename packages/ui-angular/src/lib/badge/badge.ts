import {
  Directive,
  ElementRef,
  ViewContainerRef,
  afterEveryRender,
  afterRenderEffect,
  booleanAttribute,
  effect,
  inject,
  input,
  numberAttribute,
  untracked,
  type ComponentRef,
  type OnDestroy,
} from '@angular/core';
import type { BadgeInterface, BadgeProps, ClassNameComponent } from '@udixio/core';
import {
  createBadgeAnchorController,
  createBadgeTransitionController,
  type BadgeAnchorController,
  type BadgeTransitionController,
} from '@udixio/core/dom';
import { BadgeSurface } from './badge-surface';

/**
 * A static attribute arrives as a string, and `max` only caps a number, so
 * `udxBadge="100" udxBadgeMax="99"` would otherwise render `100`. A string
 * that is a plain integer is read as the count it spells; anything else is
 * shown as written.
 */
const badgeLabelAttribute = (value: unknown): BadgeProps['label'] => {
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return value as BadgeProps['label'];
};

const optionalNumberAttribute = (value: unknown): number | undefined =>
  value === undefined || value === null || value === ''
    ? undefined
    : numberAttribute(value);

/**
 * Badges show notifications, counts, or status information on navigation
 * items and icons.
 *
 * @status beta
 * @category Communication
 * @devx
 * - Put it on what the badge marks: `<udx-icon [icon]="iInbox" udxBadge="3" />`.
 *   The directive places the badge inside the element it sits on and makes
 *   that element the containing block, so nothing has to be wrapped and no
 *   `relative` has to be remembered. Inputs are prefixed `udxBadge*` because
 *   the host element is not the directive's own.
 * - The bare attribute renders the small dot Material uses for an unread
 *   notification; any label renders the large pill. The variant follows from
 *   the content, so a small badge carrying a count cannot be expressed.
 * - `udxBadgeMax` caps a count the way Material spells it:
 *   `udxBadge="100" udxBadgeMax="99"` renders `99+`.
 * - Hiding the badge once its destination is selected is the caller's
 *   decision: set `udxBadgeVisible` to `false` rather than removing the
 *   attribute, so it can animate out -- or let `udx-navigation-rail-item` do
 *   it through its `badge` input. The show/hide scale-and-fade is implemented
 *   once with anime.js in `@udixio/core/dom`; `udxBadgeTransition` tunes it,
 *   and reduced motion skips it.
 * @a11y
 * - `udxBadgeDescription` is what a screen reader announces. Give it the
 *   meaning, not the number: `3 unread messages`, not `3`. It is rendered as
 *   visually hidden text inside a live region, so a changing count announces
 *   the whole sentence rather than the bare digit, and the visible number is
 *   hidden from assistive technology so it is not read twice.
 * - Without a description the badge is hidden from assistive technology
 *   rather than announced as a bare digit or as nothing at all; so is a
 *   badge that is not visible.
 * @limitations
 * - Material limits badge content to four characters including the `+`.
 *   Nothing truncates: silently dropping a caller's text would hide data, and
 *   `udxBadgeMax` is the tool for the count case.
 * - The badge lives inside the marked element, so that element -- or, for a
 *   `display: contents` host such as `udx-icon`, the first box inside it --
 *   must accept children. An `<img>` or an `<input>` cannot carry one.
 * - Material anchors badges inside the *icon* bounding box, so mark the icon:
 *   marking a control with a large touch target anchors to that target
 *   instead, pushing the badge away from the icon by the padding around it.
 * - The `container` element of the shared style contract is the consumer's
 *   own element here, so a `container` override in `udxBadgeClass` has no
 *   target; style that element directly.
 */
@Directive({
  selector: '[udxBadge]',
  standalone: true,
})
export class Badge implements OnDestroy {
  /** Text shown inside the badge. Omitted, it renders as the small dot. */
  readonly label = input<BadgeProps['label'], unknown>(undefined, {
    alias: 'udxBadge',
    transform: badgeLabelAttribute,
  });
  /** Caps a numeric label: 100 with a max of 99 renders `99+`. */
  readonly max = input<BadgeProps['max'], unknown>(undefined, {
    alias: 'udxBadgeMax',
    transform: optionalNumberAttribute,
  });
  /** What assistive technology announces, such as `3 unread messages`. */
  readonly description = input<BadgeProps['description']>(undefined, {
    alias: 'udxBadgeDescription',
  });
  /** Whether the badge is shown; `false` animates it out and keeps it mounted. */
  readonly visible = input(true, {
    alias: 'udxBadgeVisible',
    transform: booleanAttribute,
  });
  /** Anime.js show-hide timing. */
  readonly transition = input<BadgeProps['transition']>(undefined, {
    alias: 'udxBadgeTransition',
  });
  /** Classes, or state-aware element classes, applied through the shared style contract. */
  readonly classes = input<
    string | ClassNameComponent<BadgeInterface> | undefined
  >(undefined, { alias: 'udxBadgeClass' });

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly viewContainer = inject(ViewContainerRef);

  private surfaceRef?: ComponentRef<BadgeSurface>;
  private anchorController?: BadgeAnchorController;
  private transitionController?: BadgeTransitionController;
  private wiredElement?: HTMLElement;
  private hasAppliedInitialVisibility = false;

  constructor() {
    // The surface is created eagerly: unlike a tooltip, an attribute with no
    // value is the dot, so there is no "nothing to show" state to wait for.
    effect(() => {
      const surface = (this.surfaceRef ??= this.viewContainer.createComponent(
        BadgeSurface,
      ));
      surface.setInput('label', this.label());
      surface.setInput('max', this.max());
      surface.setInput('description', this.description());
      surface.setInput('visible', this.visible());
      surface.setInput('transition', this.transition());
      surface.setInput('classes', this.classes());
      surface.changeDetectorRef.detectChanges();
    });

    // The marked element owns its content and may rebuild it -- an icon that
    // swaps on selection replaces its `innerHTML` -- which drops the badge
    // with it. The controller's check is a parent comparison, so running it
    // after every render costs nothing when nothing moved.
    afterEveryRender(() => {
      const badge = this.surfaceRef?.instance.nativeElement;
      if (!badge) return;
      (this.anchorController ??= createBadgeAnchorController({
        host: this.host.nativeElement,
        badge,
      })).update();
    });

    // The transition lives here rather than in the surface: the directive's
    // own inputs are what change, and tracking them from the surface's inputs
    // -- fed through `setInput` -- does not re-run a render effect under
    // zoneless change detection. Guarded on the native element, not the query
    // signal, so a refreshed wrapper never rebuilds the controller and resets
    // the "first apply is instant" bookkeeping. The instant first apply runs
    // after render but before paint, so a badge created hidden never shows.
    afterRenderEffect(() => {
      const element = this.surfaceRef?.instance.badgeElement()?.nativeElement;
      if (!element || element === this.wiredElement) return;
      this.transitionController?.destroy();
      this.wiredElement = element;
      const controller = createBadgeTransitionController({
        element,
        transition: untracked(this.transition),
      });
      this.transitionController = controller;
      controller.setVisible(untracked(this.visible), true);
      this.hasAppliedInitialVisibility = false;
    });

    afterRenderEffect(() => {
      const visible = this.visible();
      if (!this.hasAppliedInitialVisibility) {
        this.hasAppliedInitialVisibility = true;
        return;
      }
      this.transitionController?.setVisible(visible);
    });
  }

  ngOnDestroy(): void {
    this.transitionController?.destroy();
    this.transitionController = undefined;
    this.anchorController?.destroy();
    this.anchorController = undefined;
    this.surfaceRef?.destroy();
    this.surfaceRef = undefined;
  }
}
