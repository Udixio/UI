import { FabMenu, type FabMenuAction } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';

const actions: FabMenuAction[] = [
  { id: 'message', label: 'New message' },
  { id: 'reply', label: 'Reply' },
  { id: 'forward', label: 'Forward' },
  { id: 'archive', label: 'Archive' },
  { id: 'reminder', label: 'Add reminder' },
];

export default function FabMenuTertiaryReact() {
  return (
    <div className="flex min-h-[28rem] w-full items-end justify-center">
      <FabMenu
        label="Compose"
        icon={iAdd}
        actions={actions}
        variant="tertiary"
        size="large"
      />
    </div>
  );
}
