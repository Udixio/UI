import { useState } from 'react';
import { Button, FabMenu, type FabMenuAction } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iEdit } from '@udixio/icons-rounded-400/edit';
import { iShare } from '@udixio/icons-rounded-400/share';

const actions: FabMenuAction[] = [
  { id: 'document', label: 'Edit document', icon: iEdit },
  { id: 'share', label: 'Share document', icon: iShare },
];

export default function FabMenuActionsReact() {
  const [open, setOpen] = useState(false);
  const [lastAction, setLastAction] = useState('None');

  return (
    <div className="grid min-h-80 w-full content-between gap-8">
      <div
        className="rounded-xl border border-outline p-4"
        role="status"
        aria-live="polite"
      >
        <p className="text-title-medium">Menu: {open ? 'open' : 'closed'}</p>
        <p className="text-body-medium text-on-surface-variant">
          Last action: {lastAction}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <Button
          label={open ? 'Close from owner' : 'Open from owner'}
          variant="outlined"
          onClick={() => setOpen((current) => !current)}
        />
        <FabMenu
          label="Create"
          icon={iAdd}
          actions={actions}
          size="large"
          extended
          open={open}
          onOpenChange={setOpen}
          onActionSelect={(action) => setLastAction(action.label)}
        />
      </div>
    </div>
  );
}
