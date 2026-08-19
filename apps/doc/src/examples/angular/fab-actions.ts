import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Fab } from '@udixio/ui-angular';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iShare } from '@udixio/icons-rounded-400/share';

@Component({
  selector: 'docs-fab-actions-angular',
  standalone: true,
  imports: [Fab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-end gap-4">
      <div class="flex flex-wrap items-end justify-end gap-4">
        <udx-fab
          label="Create"
          [icon]="addIcon"
          extended
          (click)="message.set('Action run')"
        />
        <udx-fab
          label="Share this page"
          [icon]="shareIcon"
          variant="tertiaryContainer"
          href="/components/fab/overview"
          aria-current="page"
          extended
        />
      </div>
      <p aria-live="polite" class="text-body-medium">{{ message() }}</p>
    </div>
  `,
})
export class FabActionsAngular {
  protected readonly addIcon = iAdd;
  protected readonly shareIcon = iShare;
  protected readonly message = signal('No action yet');
}
