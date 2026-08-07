import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { Button, Tooltip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tooltip-controlled-angular',
  standalone: true,
  imports: [Button, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-6 p-8">
      <lib-button
        #triggerButton
        [label]="open() ? 'Hide' : 'Show'"
        (click)="open.set(!open())"
      />
      <lib-tooltip
        [target]="trigger()"
        text="Controlled tooltip"
        [open]="open()"
        (openChange)="open.set($event)"
      />
    </div>
  `,
})
export class TooltipControlledAngular {
  protected readonly trigger = viewChild.required<ElementRef<HTMLElement>>(
    'triggerButton',
    { read: ElementRef },
  );
  protected readonly open = signal(false);
}
