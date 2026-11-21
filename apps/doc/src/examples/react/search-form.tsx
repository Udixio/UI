import { useState } from 'react';
import { Button, Search } from '@udixio/ui-react';

export default function SearchFormReact() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const submitQuery = (value: string) => setSubmitted(value);

  return (
    <form
      className="flex w-full flex-col items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('email');
        setSubmitted(typeof value === 'string' ? value : '');
      }}
    >
      <Search
        id="documentation-email-search"
        label="Search by email"
        name="email"
        query={query}
        onQueryChange={setQuery}
        onSearch={submitQuery}
        placeholder="name@example.com"
        inputMode="email"
        autoComplete="email"
        maxLength={120}
        required
        spellCheck={false}
      />
      <Button type="submit" size="small" label="Submit native form" />
      <p className="text-body-small text-on-surface-variant" role="status">
        {submitted ? `Submitted: ${submitted}` : 'Nothing submitted'}
      </p>
    </form>
  );
}
