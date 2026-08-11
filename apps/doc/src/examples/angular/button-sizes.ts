import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from '@udixio/ui-angular';

@Component({
  selector: 'docs-button-sizes-angular',
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end justify-center gap-3">
      <udx-button label="XS" size="xSmall" />
      <udx-button label="S" size="small" />
      <udx-button label="M" size="medium" />
      <udx-button label="L" size="large" />
      <udx-button label="XL" size="xLarge" />
    </div>
  `,
})
export class ButtonSizesAngular {}
