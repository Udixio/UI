import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, Tooltip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tooltip-controlled-angular',
  standalone: true,
  imports: [Button, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-6 p-8">
      <udx-button
        [label]="open() ? 'Hide' : 'Show'"
        (click)="open.set(!open())"
        udxTooltip="Controlled tooltip"
        [udxTooltipOpen]="open()"
        (udxTooltipOpenChange)="open.set($event)"
      />
    </div>
  `,
})
export class TooltipControlledAngular {
  protected readonly open = signal(false);
}
