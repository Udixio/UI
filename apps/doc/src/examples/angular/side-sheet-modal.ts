import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  viewChild,
} from '@angular/core';
import { Button, SideSheet } from '@udixio/ui-angular';

@Component({
  selector: 'docs-side-sheet-modal-angular',
  standalone: true,
  imports: [Button, SideSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #container
      class="relative min-h-80 w-full overflow-hidden rounded-xl [contain:layout]"
    >
      <div class="grid h-full content-between gap-8 p-4">
        <div
          class="rounded-xl border border-outline p-4"
          role="status"
          aria-live="polite"
        >
          <p class="text-title-medium">
            Side sheet: {{ open ? 'open' : 'closed' }}
          </p>
        </div>

        <div class="flex justify-end">
          <udx-button label="Open details" (click)="open = true" />
        </div>
      </div>

      <udx-side-sheet
        variant="modal"
        title="Details"
        [open]="open"
        (openChange)="open = $event"
        [container]="containerEl()"
      >
        <p class="p-4 text-body-medium text-on-surface-variant">
          Modal content. Press Escape, click the backdrop, or use the close
          button to dismiss it.
        </p>
      </udx-side-sheet>
    </div>
  `,
})
export class SideSheetModalAngular {
  protected open = false;

  private readonly containerRef =
    viewChild<ElementRef<HTMLElement>>('container');
  protected readonly containerEl = computed(
    () => this.containerRef()?.nativeElement,
  );
}
