import { FabMenu, type FabMenuAction } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';

const actions: FabMenuAction[] = [
  { id: 'note', label: 'Add note' },
  { id: 'photo', label: 'Take photo' },
  { id: 'attachment', label: 'Attach file' },
  { id: 'recording', label: 'Record audio' },
  { id: 'location', label: 'Add location' },
];

export default function FabMenuSecondaryReact() {
  return (
    <div className="flex min-h-[28rem] w-full items-end justify-center">
      <FabMenu
        label="Add content"
        icon={iAdd}
        actions={actions}
        variant="secondary"
        size="large"
        extended
      />
    </div>
  );
}
