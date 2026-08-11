import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from '@udixio/ui-angular';

@Component({
  selector: 'docs-button-variants-angular',
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap justify-center gap-3">
      <udx-button label="Filled" variant="filled" />
      <udx-button label="Elevated" variant="elevated" />
      <udx-button label="Tonal" variant="tonal" />
      <udx-button label="Outlined" variant="outlined" />
      <udx-button label="Text" variant="text" />
    </div>
  `,
})
export class ButtonVariantsAngular {}
