import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
} from '@angular/core';
import { Button, Tooltip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tooltip-rich-angular',
  standalone: true,
  imports: [Button, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-6 p-8">
      <udx-button #savedButton label="Rich tooltip" />
      <udx-tooltip
        [target]="savedTrigger()"
        variant="rich"
        title="Saved"
        text="Item added to favorites"
        [buttons]="{ label: 'Undo' }"
      />

      <udx-button #customButton label="Custom content" />
      <udx-tooltip [target]="customTrigger()" variant="rich">
        <strong class="text-title-small">Shortcuts</strong>
        <p class="text-body-medium">Press Cmd+K to open the command palette.</p>
      </udx-tooltip>
    </div>
  `,
})
export class TooltipRichAngular {
  protected readonly savedTrigger = viewChild.required<ElementRef<HTMLElement>>(
    'savedButton',
    { read: ElementRef },
  );
  protected readonly customTrigger = viewChild.required<ElementRef<HTMLElement>>(
    'customButton',
    { read: ElementRef },
  );
}
