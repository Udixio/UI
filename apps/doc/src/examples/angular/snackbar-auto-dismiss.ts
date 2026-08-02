import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Snackbar } from '@udixio/ui-angular';

@Component({
  selector: 'docs-snackbar-auto-dismiss-angular',
  standalone: true,
  imports: [Button, Snackbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <lib-button label="Save" (click)="open = true" />
      <lib-snackbar
        message="Saved"
        [duration]="3000"
        [open]="open"
        (openChange)="open = $event"
      />
    </div>
  `,
})
export class SnackbarAutoDismissAngular {
  protected open = false;
}
