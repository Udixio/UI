import { useState } from 'react';
import { Search } from '@udixio/ui-react';

const recentSearches = ['Material 3', 'Search', 'Text field'];

export default function SearchUncontrolledReact() {
  const [lastQuery, setLastQuery] = useState('Material 3');
  const [submittedQuery, setSubmittedQuery] = useState('');

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Search
        label="Recent searches"
        defaultQuery="Material 3"
        defaultExpanded
        onQueryChange={setLastQuery}
        onSearch={setSubmittedQuery}
      >
        {recentSearches.map((result) => (
          <div
            key={result}
            role="option"
            aria-selected={false}
            tabIndex={-1}
            className="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]"
          >
            {result}
          </div>
        ))}
      </Search>
      <p className="text-body-small text-on-surface-variant" role="status">
        Current query: {lastQuery || 'empty'} · Submitted:{' '}
        {submittedQuery || 'not yet'}
      </p>
    </div>
  );
}
