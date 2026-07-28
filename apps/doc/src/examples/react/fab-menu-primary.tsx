import { FabMenu, type FabMenuAction } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';

const actions: FabMenuAction[] = [
  { id: 'document', label: 'New document' },
  { id: 'folder', label: 'New folder' },
  { id: 'upload', label: 'Upload file' },
  { id: 'scan', label: 'Scan document' },
  { id: 'import', label: 'Import content' },
];

export default function FabMenuPrimaryReact() {
  return (
    <div className="flex min-h-[28rem] w-full items-end justify-center">
      <FabMenu label="Create" icon={iAdd} actions={actions} size="large" />
    </div>
  );
}
