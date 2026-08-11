import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
} from '@angular/core';
import { Button, Tooltip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tooltip-basic-angular',
  standalone: true,
  imports: [Button, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-6 p-8">
      <udx-button #hoverButton label="Hover me" />
      <udx-tooltip [target]="hoverTrigger()" text="Copy to clipboard" />

      <udx-button #clickButton label="Click me" />
      <udx-tooltip
        [target]="clickTrigger()"
        text="Opens on click"
        trigger="click"
      />

      <udx-button #topButton label="Top" />
      <udx-tooltip
        [target]="topTrigger()"
        text="Top placement"
        position="top"
      />
    </div>
  `,
})
export class TooltipBasicAngular {
  protected readonly hoverTrigger = viewChild.required<ElementRef<HTMLElement>>(
    'hoverButton',
    { read: ElementRef },
  );
  protected readonly clickTrigger = viewChild.required<ElementRef<HTMLElement>>(
    'clickButton',
    { read: ElementRef },
  );
  protected readonly topTrigger = viewChild.required<ElementRef<HTMLElement>>(
    'topButton',
    { read: ElementRef },
  );
}
