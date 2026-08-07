import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  afterRenderEffect,
  inject,
  input,
  untracked,
  viewChild,
  type OnDestroy,
} from '@angular/core';
import type { AnchorPosition } from '@udixio/core';
import {
  createAnchorPositionerController,
  type AnchorPositionerController,
} from '@udixio/core/dom';

/**
 * Floats projected content next to an anchor element using native CSS
 * Anchor Positioning where supported, falling back to a `position: fixed`
 * element tracked against the anchor's rect. The positioning math is
 * implemented once in `@udixio/core/dom` and shared with the React adapter.
 * @status beta
 * @category Communication
 * @devx
 * - Internal building block for `Tooltip`; not yet documented as a
 *   standalone public component.
 * - Portals its content to `document.body`.
 * @a11y
 * - Renders no semantics of its own; the caller's content and `Tooltip`'s
 *   own `role="tooltip"` carry accessibility meaning.
 * @limitations
 * - Falls back to tracking `getBoundingClientRect()` on scroll and resize
 *   in browsers without native CSS Anchor Positioning support.
 */
@Component({
  selector: 'lib-anchor-positioner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <div #floating [class]="className()" style="z-index: 50">
      <ng-content />
    </div>
  `,
})
export class AnchorPositioner implements OnDestroy {
  /** The element the floating content is positioned relative to. */
  readonly anchor = input.required<ElementRef<HTMLElement> | HTMLElement>();
  readonly position = input<AnchorPosition>('bottom');
  /** Class applied to the floating (portaled) wrapper element. */
  readonly className = input<string>();

  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly floating = viewChild<ElementRef<HTMLElement>>('floating');

  private controller?: AnchorPositionerController;
  private isPortaled = false;

  constructor() {
    afterRenderEffect(() => {
      const floating = this.floating()?.nativeElement;
      if (!floating || this.isPortaled) return;
      this.renderer.appendChild(this.document.body, floating);
      this.isPortaled = true;
    });

    afterRenderEffect((onCleanup) => {
      const floating = this.floating()?.nativeElement;
      const anchorInput = this.anchor();
      const anchor =
        anchorInput instanceof ElementRef
          ? anchorInput.nativeElement
          : anchorInput;
      if (!floating || !anchor) return;

      const controller = createAnchorPositionerController({
        anchor,
        floating,
        position: () => untracked(this.position),
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
      this.position();
      this.controller?.update();
    });
  }

  ngOnDestroy(): void {
    const floating = this.floating()?.nativeElement;
    if (this.isPortaled && floating) {
      floating.remove();
    }
  }
}
