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
  host: { style: 'display: contents' },
  template: `
    <svg
      #svg
      aria-hidden="true"
      class="h-6 w-6 fill-transparent"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      [style.stroke]="color()"
    >
      <circle
        #circle
        cx="50%"
        cy="50%"
        r="calc(50% - 2px)"
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
