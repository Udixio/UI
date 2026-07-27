import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Chip } from '@udixio/ui-angular';

@Component({
  selector: 'docs-chip-basic-angular',
  standalone: true,
  imports: [Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<lib-chip label="Option" />`,
})
export class ChipBasicAngular {}
