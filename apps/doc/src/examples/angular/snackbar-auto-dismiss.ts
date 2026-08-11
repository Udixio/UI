import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Snackbar } from '@udixio/ui-angular';

@Component({
  selector: 'docs-snackbar-auto-dismiss-angular',
  standalone: true,
  imports: [Button, Snackbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <udx-button label="Save" (click)="open = true" />
      <udx-snackbar
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
