import { ContextMenu, MenuItem } from '@udixio/ui-react';

export default function ContextMenuReact() {
  return (
    <ContextMenu
      accessibleLabel="Document actions"
      trigger={
        <button className="rounded-xl border border-outline px-6 py-4">
          Right-click or press Shift+F10
        </button>
      }
    >
      <MenuItem label="Rename" />
      <MenuItem label="Duplicate" />
      <MenuItem label="Delete" />
    </ContextMenu>
  );
}
