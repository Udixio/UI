import { useState } from 'react';
import { iFilter } from '@udixio/icons-rounded-400/filter';
import { iHistory } from '@udixio/icons-rounded-400/history';
import { iSettings } from '@udixio/icons-rounded-400/settings';
import { iTune } from '@udixio/icons-rounded-400/tune';
import { IconButton, Search } from '@udixio/ui-react';

const history = ['Material search', 'Search accessibility', 'Search patterns'];

export default function SearchIconsReact() {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4">
      <Search
        label="Filter results"
        defaultQuery="Material"
        leadingIcon={iFilter}
        clearLabel="Remove filter"
        trailingActions={
          <IconButton
            icon={iTune}
            label="Open filters"
            tooltip={false}
            toggleable
            pressed={filtersOpen}
            onPressedChange={setFiltersOpen}
          />
        }
      />
      <Search
        label="Search history"
        query={query}
        expanded={expanded}
        onQueryChange={setQuery}
        onExpandedChange={setExpanded}
        leadingIcon={iHistory}
        clearable={false}
        clearLabel="Clear history query"
        resultsLabel="Search history suggestions"
        trailingActions={
          <>
            <IconButton
              icon={iSettings}
              label="Open search settings"
              tooltip={false}
              toggleable
              pressed={settingsOpen}
              onPressedChange={setSettingsOpen}
            />
            <IconButton
              icon={iTune}
              label="Open search filters"
              tooltip={false}
              onClick={() => setFiltersOpen(true)}
            />
          </>
        }
      >
        {history.map((result) => (
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
    </div>
  );
}
