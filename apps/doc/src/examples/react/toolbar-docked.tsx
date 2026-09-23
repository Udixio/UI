import { useState } from 'react';
import { Fab, Toolbar } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iMoreHoriz } from '@udixio/icons-rounded-400/more_horiz';
import { iRedo } from '@udixio/icons-rounded-400/redo';
import { iShare } from '@udixio/icons-rounded-400/share';
import { iUndo } from '@udixio/icons-rounded-400/undo';

export default function ToolbarDockedReact() {
  const [lastAction, setLastAction] = useState('None');
  const actions = [
    {
      id: 'undo',
      label: 'Undo',
      icon: iUndo,
      onClick: () => setLastAction('Undo'),
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: iRedo,
      onClick: () => setLastAction('Redo'),
    },
    {
      id: 'share',
      label: 'Share document',
      icon: iShare,
      onClick: () => setLastAction('Share document'),
    },
  ];

  return (
    <div className="relative flex min-h-80 w-full flex-col overflow-hidden rounded-2xl border border-outline bg-surface-container-low">
      <div className="flex flex-1 flex-col justify-center gap-2 p-6">
        <p className="text-title-medium">Document canvas</p>
        <p className="text-body-medium text-on-surface-variant">
          The docked toolbar stays attached to the bottom of this surface.
        </p>
        <p
          className="text-body-small text-on-surface-variant"
          role="status"
          aria-live="polite"
        >
          Last action: {lastAction}
        </p>
      </div>

      <div className="relative">
        <Fab
          className="absolute -top-8 right-4 z-10"
          label="Create document"
          icon={iAdd}
          onClick={() => setLastAction('Create document')}
        />
        <Toolbar
          accessibleLabel="Document actions"
          actions={actions}
          maxVisible={2}
          more={{ label: 'More document actions', icon: iMoreHoriz }}
        />
      </div>
    </div>
  );
}
