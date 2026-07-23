import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button } from '@udixio/ui-angular';

@Component({
  selector: 'docs-button-actions-angular',
  standalone: true,
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-3">
      <div class="flex flex-wrap justify-center gap-3">
        <lib-button label="Run action" (click)="message.set('Action run')" />
        <lib-button
          label="Button documentation"
          href="/components/button/overview"
          aria-current="page"
          variant="outlined"
        />
      </div>
      <p aria-live="polite" class="text-body-medium">{{ message() }}</p>
    </div>
  `,
})
export class ButtonActionsAngular {
  protected readonly message = signal('No action yet');
}
