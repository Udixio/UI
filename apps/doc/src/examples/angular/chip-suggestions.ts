import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Chip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-chip-suggestions-angular',
  standalone: true,
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap gap-2">
      <udx-chip label="Near me" />
      <udx-chip label="Open now" variant="elevated" />
      <udx-chip label="4★ and up" />
    </div>
  `,
})
export class ChipSuggestionsAngular {}
