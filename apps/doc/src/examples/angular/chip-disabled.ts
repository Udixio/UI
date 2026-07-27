import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Chip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-chip-disabled-angular',
  standalone: true,
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap gap-3">
      <lib-chip label="Indisponible" disabled />
      <lib-chip label="Lien indisponible" href="/components/chip" disabled />
    </div>
  `,
})
export class ChipDisabledAngular {}
