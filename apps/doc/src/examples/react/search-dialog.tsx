import { useState } from 'react';
import { Button, Search } from '@udixio/ui-react';

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
          <Button
            size="small"
            className="self-start"
            label="Open settings"
            onClick={() => setSelectedAction('Settings opened')}
          />
        </div>
      </Search>
      <p className="text-body-small text-on-surface-variant" role="status">
        {selectedAction}
      </p>
    </div>
  );
}
