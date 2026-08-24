import { useMemo, useState } from 'react';
import { Search } from '@udixio/ui-react';

const documents = ['Button', 'Card', 'Menu', 'Search', 'Text field'];

export default function SearchBasicReact() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents.filter((document) =>
      document.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Search
        label="Search documentation"
        placeholder="Search components"
        query={query}
        onQueryChange={setQuery}
        onSearch={setSubmitted}
      >
        {results.map((result) => (
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
      <p className="text-body-small text-on-surface-variant">
        {submitted ? `Submitted: ${submitted}` : 'Press Enter to submit'}
      </p>
    </div>
  );
}
