import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Snackbar } from '@udixio/ui-angular';

@Component({
  selector: 'docs-snackbar-basic-angular',
  standalone: true,
  imports: [Button, Snackbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <lib-button label="Send message" (click)="open = true" />
      <lib-snackbar
        message="Message sent"
        [open]="open"
        (openChange)="open = $event"
      />
    </div>
  `,
})
export class SnackbarBasicAngular {
  protected open = false;
}
