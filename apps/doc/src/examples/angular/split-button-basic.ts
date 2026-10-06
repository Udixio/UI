import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { iDescription } from '@udixio/icons-rounded-400/description';
import { iLink } from '@udixio/icons-rounded-400/link';
import { iPictureAsPdf } from '@udixio/icons-rounded-400/picture_as_pdf';
import { iTableView } from '@udixio/icons-rounded-400/table_view';
import {
  SplitButton,
  type SplitButtonAction,
  type SplitButtonActionSelectEvent,
} from '@udixio/ui-angular';

@Component({
  selector: 'docs-split-button-basic-angular',
  standalone: true,
  imports: [SplitButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-4">
      <udx-split-button
        label="Download PDF"
        [icon]="pdfIcon"
        menuLabel="More report export options"
        [actions]="actions"
        variant="filled"
        size="medium"
        (primaryAction)="message.set('PDF export requested')"
        (actionSelect)="selectAction($event)"
      />
      <p class="text-body-medium" aria-live="polite">{{ message() }}</p>
    </div>
  `,
})
export class SplitButtonBasicAngular {
  protected readonly pdfIcon = iPictureAsPdf;
  protected readonly actions: SplitButtonAction[] = [
    { id: 'csv', label: 'Download as CSV', icon: iTableView },
    { id: 'excel', label: 'Download as Excel workbook', icon: iDescription },
    { id: 'link', label: 'Copy report link', icon: iLink },
  ];
  protected readonly message = signal('Choose an export format');

  protected selectAction(event: SplitButtonActionSelectEvent): void {
    this.message.set(`${event.action.label} selected`);
  }
}
