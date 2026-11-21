import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Button, Search } from '@udixio/ui-angular';

@Component({
  selector: 'docs-search-autofocus-angular',
  standalone: true,
  imports: [Button, Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col items-center gap-3">
      <udx-button
        size="small"
        label="Mount auto-focused search"
        [disabled]="mounted"
        (click)="mounted = true"
      />
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
