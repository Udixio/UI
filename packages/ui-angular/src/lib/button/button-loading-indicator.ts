import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  viewChild,
} from '@angular/core';
import { createCircularProgressController } from '@udixio/core/dom';

@Component({
  selector: 'udx-button-loading-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: '[&:not([hidden])]:contents', 'data-motion-box': 'child' },
  template: `
    <svg
      #svg
      style="transform: rotate(-90deg)"
      aria-hidden="true"
      class="h-6 w-6 fill-transparent"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      [style.stroke]="color()"
    >
      <circle
        #circle
        pathLength="1"
        style="stroke-dasharray: 0.25 1"
        cx="50%"
        cy="50%"
        r="22"
        stroke-width="4"
        stroke-linecap="round"
      />
    </svg>
  `,
})
export class ButtonLoadingIndicator {
  readonly color = input.required<string>();

  private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private readonly circle =
    viewChild.required<ElementRef<SVGCircleElement>>('circle');

  constructor() {
    afterRenderEffect((onCleanup) => {
      onCleanup(
        createCircularProgressController({
          svg: this.svg().nativeElement,
          circle: this.circle().nativeElement,
        }),
      );
    });
  }
}
