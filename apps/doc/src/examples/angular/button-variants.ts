import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from '@udixio/ui-angular';

@Component({
  selector: 'docs-button-variants-angular',
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap justify-center gap-3">
      <lib-button label="Filled" variant="filled" />
      <lib-button label="Elevated" variant="elevated" />
      <lib-button label="Tonal" variant="tonal" />
      <lib-button label="Outlined" variant="outlined" />
      <lib-button label="Text" variant="text" />
    </div>
  `,
})
export class ButtonVariantsAngular {}
