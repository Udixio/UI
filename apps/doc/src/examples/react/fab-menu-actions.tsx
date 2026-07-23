import { FabMenu, type FabMenuAction } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iEdit } from '@udixio/icons-rounded-400/edit';
import { iShare } from '@udixio/icons-rounded-400/share';

const actions: FabMenuAction[] = [
  { id: 'document', label: 'Document', icon: iEdit },
  { id: 'share', label: 'Share', icon: iShare, href: '/share' },
];

export default function FabMenuActionsReact() {
  return (
    <div className="flex h-64 items-end">
      <FabMenu
        label="Create"
        icon={iAdd}
        actions={actions}
        onActionSelect={(action) => console.log(action.id)}
      />
    </div>
  );
}
