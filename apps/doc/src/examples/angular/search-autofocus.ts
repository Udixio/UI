import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Search } from '@udixio/ui-angular';

@Component({
  selector: 'docs-search-autofocus-angular',
  standalone: true,
  imports: [Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col items-center gap-3">
      <button
        type="button"
        class="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
        [disabled]="mounted"
        (click)="mounted = true"
      >
        Mount auto-focused search
      </button>
      @if (mounted) {
        <udx-search
          label="Auto-focused search"
          [autoFocus]="true"
          defaultQuery="Material"
          (focused)="focusCount = focusCount + 1"
          (blurred)="blurCount = blurCount + 1"
        />
      }
      <p class="text-body-small text-on-surface-variant" role="status">
        Focus events: {{ focusCount }} · Blur events: {{ blurCount }}
      </p>
    </div>
  `,
})
export class SearchAutofocusAngular {
  protected mounted = false;
  protected focusCount = 0;
  protected blurCount = 0;
}
