import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Search } from '@udixio/ui-angular';

const recentSearches = ['Material 3', 'Search', 'Text field'];

@Component({
  selector: 'docs-search-uncontrolled-angular',
  standalone: true,
  imports: [Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col items-center gap-3">
      <udx-search
        label="Recent searches"
        defaultQuery="Material 3"
        defaultExpanded
        (queryChange)="lastQuery = $event"
        (searchSubmit)="submittedQuery = $event"
      >
        @for (result of recentSearches; track result) {
          <div
            role="option"
            aria-selected="false"
            tabindex="-1"
            class="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]"
          >
            {{ result }}
          </div>
        }
      </udx-search>
      <p class="text-body-small text-on-surface-variant" role="status">
        Current query: {{ lastQuery || 'empty' }} · Submitted:
        {{ submittedQuery || 'not yet' }}
      </p>
    </div>
  `,
})
export class SearchUncontrolledAngular {
  protected readonly recentSearches = recentSearches;
  protected lastQuery = 'Material 3';
  protected submittedQuery = '';
}
