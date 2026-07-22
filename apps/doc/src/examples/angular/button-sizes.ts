import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from '@udixio/ui-angular';

@Component({
  selector: 'docs-button-sizes-angular',
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end justify-center gap-3">
      <lib-button label="XS" size="xSmall" />
      <lib-button label="S" size="small" />
      <lib-button label="M" size="medium" />
      <lib-button label="L" size="large" />
      <lib-button label="XL" size="xLarge" />
    </div>
  `,
})
export class ButtonSizesAngular {}
