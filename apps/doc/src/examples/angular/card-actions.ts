import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Card } from '@udixio/ui-angular';

@Component({
  selector: 'docs-card-actions-angular',
  standalone: true,
  imports: [Card],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col items-center gap-3">
      <div class="flex w-full flex-wrap gap-4">
        <lib-card
          href="/components/card/overview"
          variant="elevated"
          className="flex h-40 min-w-48 flex-1 items-center justify-center"
        >
          <p>Navigate to the Card page</p>
        </lib-card>
        <lib-card
          interactive
          variant="filled"
          className="flex h-40 min-w-48 flex-1 items-center justify-center"
          (click)="message.set('Card activated')"
        >
          <p>Run an action</p>
        </lib-card>
      </div>
      <p aria-live="polite" class="text-body-medium">{{ message() }}</p>
    </div>
  `,
})
export class CardActionsAngular {
  protected readonly message = signal('No action yet');
}
