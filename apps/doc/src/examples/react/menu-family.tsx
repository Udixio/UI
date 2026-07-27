import { useState } from 'react';
import { Menu, MenuGroup, MenuHeadline, MenuItem } from '@udixio/ui-react';

export default function MenuFamilyReact() {
  const [compact, setCompact] = useState(false);

  return (
    <Menu accessibleLabel="Editor actions">
      <MenuGroup>
        <MenuHeadline label="Document" />
        <MenuItem label="Copy" />
        <MenuItem label="Paste" disabled />
      </MenuGroup>
      <MenuGroup label="View">
        <MenuItem
          label="Compact mode"
          selectionType="multiple"
          selected={compact}
          onSelectedChange={setCompact}
        />
      </MenuGroup>
    </Menu>
  );
}
