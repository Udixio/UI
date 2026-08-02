import { ChangeDetectionStrategy, Component } from '@angular/core';
import { iCheck } from '@udixio/icons-rounded-400/check';
import { Button, Snackbar } from '@udixio/ui-angular';

@Component({
  selector: 'docs-snackbar-custom-icon-angular',
  standalone: true,
  imports: [Button, Snackbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-start gap-4">
      <lib-button label="Show" (click)="open = true" />
      <lib-snackbar
        message="Done"
        [closeIcon]="closeIcon"
        [open]="open"
        (openChange)="open = $event"
      />
    </div>
  `,
})
export class SnackbarCustomIconAngular {
  protected open = false;
  protected readonly closeIcon = iCheck;
}
