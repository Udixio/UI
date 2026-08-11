import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button } from '@udixio/ui-angular';

@Component({
  selector: 'docs-button-states-angular',
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center justify-center gap-3">
      <udx-button label="Disabled" disabled />
      <udx-button label="Sending" loading />
      <udx-button label="Rounded" shape="rounded" variant="tonal" />
      <udx-button label="Squared" shape="squared" variant="outlined" />
      <udx-button label="Static shape" shapeFeedback="none" variant="text" />
    </div>
  `,
})
export class ButtonStatesAngular {}
