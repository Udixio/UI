import { Menu, MenuItem, MenuSubmenu } from '@udixio/ui-react';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';

export default function MenuSubmenusReact() {
  return (
    <Menu accessibleLabel="Document actions">
      <MenuItem label="Duplicate" leadingIcon={iContentCopy} />
      <MenuItem label="Rename" />
      <MenuSubmenu label="Share">
        <MenuItem label="Copy link" />
        <MenuItem label="Send by email" />
        <MenuSubmenu label="More options">
          <MenuItem label="Export" />
          <MenuItem label="Publish" />
        </MenuSubmenu>
      </MenuSubmenu>
      <MenuItem label="Move to trash" />
    </Menu>
  );
}
