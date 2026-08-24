import { useState } from 'react';
import { Search } from '@udixio/ui-react';

type ResultState = 'results' | 'empty' | 'loading' | 'error';

const results = [
  'Material Search',
  'Search guidelines',
  'Search accessibility',
];

const stateLabels: Record<ResultState, string> = {
  results: 'Results available',
  empty: 'No results',
  loading: 'Loading results',
  error: 'Unable to load results',
};

export default function SearchResultsReact() {
  const [query, setQuery] = useState('search');
  const [state, setState] = useState<ResultState>('results');

  const showState = (nextState: ResultState) => setState(nextState);

  return (
    <div className="flex w-full flex-col gap-4">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Result state"
      >
        {(Object.keys(stateLabels) as ResultState[]).map((resultState) => (
          <button
            key={resultState}
            type="button"
            aria-pressed={state === resultState}
            className="rounded-full bg-surface-container-high px-3 py-2 text-label-medium text-on-surface hover:bg-on-surface/[0.08]"
            onClick={() => showState(resultState)}
          >
            {resultState}
          </button>
        ))}
      </div>
      <Search
        label="Remote documentation search"
        query={query}
        onQueryChange={setQuery}
        defaultExpanded
        resultsLabel="Remote search results"
        onSearch={() => showState('loading')}
      >
        {state === 'results' ? (
          results.map((result) => (
            <div
              key={result}
              role="option"
              aria-selected={false}
              tabIndex={-1}
              className="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]"
            >
              {result}
            </div>
          ))
        ) : (
          <div
            role="option"
            aria-selected={false}
            aria-disabled="true"
            aria-live="polite"
            tabIndex={-1}
            className="px-4 py-3 text-body-medium text-on-surface-variant"
          >
            {stateLabels[state]}
          </div>
        )}
      </Search>
      <p className="text-body-small text-on-surface-variant" role="status">
        Consumer-managed state: {stateLabels[state]}
      </p>
    </div>
  );
}
