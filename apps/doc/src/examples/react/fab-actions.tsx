import { useState } from 'react';
import { Fab } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iShare } from '@udixio/icons-rounded-400/share';

export default function FabActionsReact() {
  const [message, setMessage] = useState('No action yet');

  return (
    <div className="flex flex-col items-end gap-4">
      <div className="flex flex-wrap items-end justify-end gap-4">
        <Fab
          label="Create"
          icon={iAdd}
          extended
          onClick={() => setMessage('Action run')}
        />
        <Fab
          label="Share this page"
          icon={iShare}
          variant="tertiaryContainer"
          href="/components/fab/overview"
          aria-current="page"
          extended
        />
      </div>
      <p aria-live="polite" className="text-body-medium">
        {message}
      </p>
    </div>
  );
}
