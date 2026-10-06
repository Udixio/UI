import { ChangeDetectionStrategy, Component } from '@angular/core';
import { iDownload } from '@udixio/icons-rounded-400/download';
import { SplitButton, type SplitButtonAction } from '@udixio/ui-angular';
import type { IconButtonWidth } from '@udixio/core';

@Component({
  selector: 'docs-split-button-width-angular',
  standalone: true,
  imports: [SplitButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end justify-center gap-3">
      @for (width of widths; track width) {
        <figure class="flex flex-col items-center gap-2">
          <udx-split-button
            label="Download report"
            [icon]="downloadIcon"
            menuLabel="More report download formats"
            [actions]="actions"
            size="medium"
            variant="filled"
            [menuButtonProps]="{ width: width }"
          />
          <figcaption class="text-label-small">{{ width }}</figcaption>
        </figure>
      }
    </div>
  `,
})
export class SplitButtonWidthAngular {
  protected readonly actions: SplitButtonAction[] = [
    { id: 'csv', label: 'Download as CSV' },
    { id: 'excel', label: 'Download as Excel workbook' },
  ];
  protected readonly downloadIcon = iDownload;
  protected readonly widths: IconButtonWidth[] = ['narrow', 'default', 'wide'];
}
