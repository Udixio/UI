import { useState } from 'react';
import { Search } from '@udixio/ui-react';

export default function SearchDialogReact() {
  const [selectedAction, setSelectedAction] = useState('No action selected');

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Search
        label="Search commands"
        defaultQuery="settings"
        defaultExpanded
        resultsRole="dialog"
        resultsLabel="Command details"
        clearLabel="Clear command query"
      >
        <div className="flex flex-col gap-3 p-4">
          <h3 className="text-title-medium">Settings</h3>
          <p className="text-body-medium text-on-surface-variant">
            This is a rich projected result, not a listbox option. The consumer
            owns its internal focus and actions.
          </p>
          <button
            type="button"
            className="self-start rounded-full bg-primary px-4 py-2 text-label-large text-on-primary"
            onClick={() => setSelectedAction('Settings opened')}
          >
            Open settings
          </button>
        </div>
      </Search>
      <p className="text-body-small text-on-surface-variant" role="status">
        {selectedAction}
      </p>
    </div>
  );
}
