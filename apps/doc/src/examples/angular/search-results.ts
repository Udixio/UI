import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Search } from '@udixio/ui-angular';

type ResultState = 'results' | 'empty' | 'loading' | 'error';

const results = [
  'Material Search',
  'Search guidelines',
  'Search accessibility',
];

@Component({
  selector: 'docs-search-results-angular',
  standalone: true,
  imports: [Search],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full flex-col gap-4">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Result state">
        @for (resultState of resultStates; track resultState) {
          <button
            type="button"
            [attr.aria-pressed]="state === resultState"
            class="rounded-full bg-surface-container-high px-3 py-2 text-label-medium text-on-surface hover:bg-on-surface/[0.08]"
            (click)="showState(resultState)"
          >
            {{ resultState }}
          </button>
        }
      </div>
      <udx-search
        label="Remote documentation search"
        [(query)]="query"
        defaultExpanded
        resultsLabel="Remote search results"
        (searchSubmit)="showState('loading')"
      >
        @if (state === 'results') {
          @for (result of results; track result) {
            <div
              role="option"
              aria-selected="false"
              tabindex="-1"
              class="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]"
            >
              {{ result }}
            </div>
          }
        } @else {
          <div
            role="option"
            aria-selected="false"
            aria-disabled="true"
            aria-live="polite"
            tabindex="-1"
            class="px-4 py-3 text-body-medium text-on-surface-variant"
          >
            {{ stateLabels[state] }}
          </div>
        }
      </udx-search>
      <p class="text-body-small text-on-surface-variant" role="status">
        Consumer-managed state: {{ stateLabels[state] }}
      </p>
    </div>
  `,
})
export class SearchResultsAngular {
  protected readonly resultStates: ResultState[] = [
    'results',
    'empty',
    'loading',
    'error',
  ];
  protected readonly results = results;
  protected readonly stateLabels: Record<ResultState, string> = {
    results: 'Results available',
    empty: 'No results',
    loading: 'Loading results',
    error: 'Unable to load results',
  };
  protected query = 'search';
  protected state: ResultState = 'results';

  protected showState(nextState: ResultState): void {
    this.state = nextState;
  }
}
