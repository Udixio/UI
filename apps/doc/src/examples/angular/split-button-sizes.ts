import { ChangeDetectionStrategy, Component } from '@angular/core';
import { iPictureAsPdf } from '@udixio/icons-rounded-400/picture_as_pdf';
import { SplitButton, type SplitButtonAction } from '@udixio/ui-angular';
import type { SplitButtonSize } from '@udixio/core';

@Component({
  selector: 'docs-split-button-sizes-angular',
  standalone: true,
  imports: [SplitButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-end justify-center gap-3">
      @for (size of sizes; track size) {
        <figure class="flex flex-col items-center gap-2">
          <udx-split-button
            label="Download PDF"
            [icon]="pdfIcon"
            menuLabel="More report export formats"
            [actions]="actions"
            variant="filled"
            [size]="size"
          />
          <figcaption class="text-label-small">{{ size }}</figcaption>
        </figure>
      }
    </div>
  `,
})
export class SplitButtonSizesAngular {
  protected readonly pdfIcon = iPictureAsPdf;
  protected readonly actions: SplitButtonAction[] = [
    { id: 'csv', label: 'Download as CSV' },
    { id: 'excel', label: 'Download as Excel workbook' },
  ];
  protected readonly sizes: SplitButtonSize[] = [
    'xSmall',
    'small',
    'medium',
    'large',
    'xLarge',
  ];
}
