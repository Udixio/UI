import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from '@udixio/ui-angular';

@Component({
  selector: 'docs-button-states-angular',
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center justify-center gap-3">
      <lib-button label="Disabled" disabled />
      <lib-button label="Sending" loading />
      <lib-button label="Rounded" shape="rounded" variant="tonal" />
      <lib-button label="Squared" shape="squared" variant="outlined" />
    </div>
  `,
})
export class ButtonStatesAngular {}
