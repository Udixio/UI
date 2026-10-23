import {
  ContextMenu,
  MenuGroup,
  MenuHeadline,
  MenuItem,
} from '@udixio/ui-react';

const scrollableActions = [
  'Rename',
  'Duplicate',
  'Move to folder',
  'Make available offline',
  'Add to favorites',
  'Share',
  'Download',
  'Archive',
  'Delete',
];

export default function ContextMenuReact() {
  return (
    <div className="flex flex-wrap gap-3">
      <ContextMenu
        accessibleLabel="Simple document actions"
        trigger={
          <button
            type="button"
            className="rounded-xl border border-outline px-4 py-3"
          >
            Simple actions
          </button>
        }
      >
        <MenuItem label="Rename" />
        <MenuItem label="Duplicate" />
        <MenuItem label="Delete" />
      </ContextMenu>

      <ContextMenu
        accessibleLabel="Grouped document actions"
        trigger={
          <button
            type="button"
            className="rounded-xl border border-outline px-4 py-3"
          >
            Grouped actions
          </button>
        }
      >
        <MenuGroup>
          <MenuHeadline label="Document" />
          <MenuItem label="Rename" />
          <MenuItem label="Duplicate" />
        </MenuGroup>
        <MenuGroup label="View">
          <MenuItem label="Open preview" />
          <MenuItem label="Show details" />
        </MenuGroup>
      </ContextMenu>

      <ContextMenu
        accessibleLabel="Many document actions"
        trigger={
          <button
            type="button"
            className="rounded-xl border border-outline px-4 py-3"
          >
            Long actions
          </button>
        }
      >
        {scrollableActions.map((label) => (
          <MenuItem key={label} label={label} />
        ))}
      </ContextMenu>
    </div>
  );
}
