import { ChangeDetectionStrategy, Component } from '@angular/core';
import { iDownload } from '@udixio/icons-rounded-400/download';
import { SplitButton, type SplitButtonAction } from '@udixio/ui-angular';

@Component({
  selector: 'docs-split-button-disabled-angular',
  standalone: true,
  imports: [SplitButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center gap-3">
      <p class="text-body-medium">Choose a report to enable export.</p>
      <udx-split-button
        label="Export report"
        [icon]="downloadIcon"
        menuLabel="More report export formats"
        [actions]="actions"
        variant="filled"
        size="medium"
        disabled
      />
    </div>
  `,
})
export class SplitButtonDisabledAngular {
  protected readonly downloadIcon = iDownload;
  protected readonly actions: SplitButtonAction[] = [
    { id: 'csv', label: 'Download as CSV' },
    { id: 'excel', label: 'Download as Excel workbook' },
  ];
}
