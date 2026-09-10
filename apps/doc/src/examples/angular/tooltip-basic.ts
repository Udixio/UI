import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Tooltip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tooltip-basic-angular',
  standalone: true,
  imports: [Button, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-6 p-8">
      <udx-button label="Hover me" udxTooltip="Copy to clipboard" />

      <udx-button
        label="Click me"
        udxTooltip="Opens on click"
        udxTooltipTrigger="click"
      />

      <udx-button
        label="Top"
        udxTooltip="Top placement"
        udxTooltipPosition="top"
      />
    </div>
  `,
})
export class TooltipBasicAngular {}
