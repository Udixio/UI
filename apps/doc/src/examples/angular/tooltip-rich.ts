import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Tooltip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tooltip-rich-angular',
  standalone: true,
  imports: [Button, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-6 p-8">
      <udx-button
        label="Rich tooltip"
        udxTooltipVariant="rich"
        udxTooltipTitle="Saved"
        udxTooltip="Item added to favorites"
        [udxTooltipButtons]="{ label: 'Undo' }"
      />

      <ng-template #shortcuts>
        <strong class="text-title-small">Shortcuts</strong>
        <p class="text-body-medium">Press Cmd+K to open the command palette.</p>
      </ng-template>
      <udx-button
        label="Custom content"
        udxTooltipVariant="rich"
        [udxTooltipContent]="shortcuts"
      />
    </div>
  `,
})
export class TooltipRichAngular {}
