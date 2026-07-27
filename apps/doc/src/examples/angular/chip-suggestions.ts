import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Chip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-chip-suggestions-angular',
  standalone: true,
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap gap-2">
      <lib-chip label="Près de moi" />
      <lib-chip label="Ouvert maintenant" variant="elevated" />
      <lib-chip label="4★ et +" />
    </div>
  `,
})
export class ChipSuggestionsAngular {}
