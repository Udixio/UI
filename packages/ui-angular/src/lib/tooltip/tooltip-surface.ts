import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { TooltipProps } from '@udixio/core';
import { AnchorPositioner } from '../anchor-positioner/anchor-positioner';
import { Button } from '../button/button';

export interface TooltipButtonAction {
  label: string;
  onClick?: () => void;
}

/**
 * The floating panel a `Tooltip` directive owns.
 *
 * @status beta
 * @category Communication
 * @devx
 * - Building block for the `Tooltip` directive, which instantiates it; not
 *   meant to be placed in a template directly.
 * - Renders `title`/`text`/`buttons`, or `content` when a template is given.
 * @a11y
 * - Carries `role="tooltip"`, and hides itself with `aria-hidden` plus `inert`
 *   while closed.
 * @limitations
 * - Stays mounted while closed so it can animate out; expensive `content` is
 *   not torn down until the directive itself is destroyed.
 */
@Component({
  selector: 'udx-tooltip-surface',
  standalone: true,
  imports: [AnchorPositioner, Button, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <udx-anchor-positioner [anchor]="anchor()" [position]="position()">
      <div
        #surface
        [id]="surfaceId()"
        role="tooltip"
        [attr.aria-hidden]="!isOpen()"
        [attr.inert]="!isOpen() ? '' : null"
        [class]="styles()['toolTip']"
        style="opacity: 0"
        (mouseenter)="surfaceHovered.emit(true)"
        (mouseleave)="surfaceHovered.emit(false)"
      >
        <div [class]="styles()['container']">
          @if (content()) {
            <div [class]="styles()['content']">
              <ng-container [ngTemplateOutlet]="content()!" />
            </div>
          } @else {
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
          }
        </div>
      </div>
    </udx-anchor-positioner>
  `,
})
export class TooltipSurface {
  readonly anchor = input.required<ElementRef<HTMLElement> | HTMLElement>();
  readonly surfaceId = input.required<string>();
  readonly position = input<TooltipProps['position']>('bottom');
  readonly title = input<TooltipProps['title']>();
  readonly text = input<TooltipProps['text']>();
  readonly buttons = input<TooltipButtonAction | TooltipButtonAction[]>();
  readonly content = input<TemplateRef<unknown>>();
  readonly isOpen = input(false);
  /**
   * Resolved element classes. The directive owns the style contract, because
   * it is the only side holding every public prop the style function reads.
   */
  readonly styles = input.required<Record<string, string>>();

  /** True when the pointer enters the panel, false when it leaves. */
  readonly surfaceHovered = output<boolean>();

  readonly surfaceElement = viewChild<ElementRef<HTMLDivElement>>('surface');

  protected readonly buttonList = () => {
    const value = this.buttons();
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

}
