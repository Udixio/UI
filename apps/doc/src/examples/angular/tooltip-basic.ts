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
      <lib-button #hoverButton label="Hover me" />
      <lib-tooltip [target]="hoverTrigger()" text="Copy to clipboard" />

      <lib-button #clickButton label="Click me" />
      <lib-tooltip
        [target]="clickTrigger()"
        text="Opens on click"
        trigger="click"
      />

      <lib-button #topButton label="Top" />
      <lib-tooltip
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
