import { useState } from 'react';
import { Search } from '@udixio/ui-react';

export default function SearchStatesReact() {
  const [focusState, setFocusState] = useState('Focus the read-only field');

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid w-full gap-4 md:grid-cols-3">
        <Search
          label="Unavailable search"
          defaultQuery="Unavailable"
          disabled
        />
        <Search
          label="Read-only search"
          query="Locked query"
          readOnly
          clearable={false}
          onFocus={() => setFocusState('Read-only field focused')}
          onBlur={() => setFocusState('Read-only field blurred')}
        />
        <Search
          label="Search without clear action"
          defaultQuery="Persistent filter"
          clearable={false}
        />
      </div>
      <p className="text-body-small text-on-surface-variant" role="status">
        {focusState}
      </p>
    </div>
  );
}
