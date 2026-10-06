import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { iPictureAsPdf } from '@udixio/icons-rounded-400/picture_as_pdf';
import {
  SplitButton,
  type SplitButtonAction,
  type SplitButtonActionSelectEvent,
} from '@udixio/ui-angular';

@Component({
  selector: 'docs-split-button-content-angular',
  standalone: true,
  imports: [SplitButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-4">
      <div class="flex flex-wrap items-end justify-center gap-5">
        <figure class="flex flex-col items-center gap-2">
          <udx-split-button
            label="Download PDF"
            [icon]="pdfIcon"
            menuLabel="More report export formats"
            [actions]="actions"
            variant="filled"
            size="medium"
            (primaryAction)="requestPdf()"
            (actionSelect)="selectAction($event)"
          />
          <figcaption class="text-label-small">Icon and label</figcaption>
        </figure>
        <figure class="flex flex-col items-center gap-2">
          <udx-split-button
            label="Download PDF"
            menuLabel="More report export formats"
            [actions]="actions"
            variant="filled"
            size="medium"
            (primaryAction)="requestPdf()"
            (actionSelect)="selectAction($event)"
          />
          <figcaption class="text-label-small">Label only</figcaption>
        </figure>
        <figure class="flex flex-col items-center gap-2">
          <udx-split-button
            [icon]="pdfIcon"
            accessibleLabel="Download PDF"
            menuLabel="More report export formats"
            [actions]="actions"
            variant="filled"
            size="medium"
            (primaryAction)="requestPdf()"
            (actionSelect)="selectAction($event)"
          />
          <figcaption class="text-label-small">
            Icon only, accessible name “Download PDF”
          </figcaption>
        </figure>
      </div>
      <p class="text-body-medium" aria-live="polite">{{ message() }}</p>
    </div>
  `,
})
export class SplitButtonContentAngular {
  protected readonly pdfIcon = iPictureAsPdf;
  protected readonly actions: SplitButtonAction[] = [
    { id: 'csv', label: 'Download as CSV' },
    { id: 'excel', label: 'Download as Excel workbook' },
  ];
  protected readonly message = signal('Choose an export format');

  protected requestPdf(): void {
    this.message.set('PDF export requested');
  }

  protected selectAction(event: SplitButtonActionSelectEvent): void {
    this.message.set(`${event.action.label} selected`);
  }
}
