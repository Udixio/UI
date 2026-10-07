import { Menu, MenuHeadline, MenuItem } from '@udixio/ui-react';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iOpenInNew } from '@udixio/icons-rounded-400/open_in_new';

export default function MenuVariantsReact() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-6">
      <Menu accessibleLabel="Standard actions">
        <MenuHeadline label="Standard" />
        <MenuItem label="Copy" leadingIcon={iContentCopy} />
        <MenuItem
          label="Open API reference"
          href="/components/menu/api"
          target="_blank"
          trailingIcon={iOpenInNew}
        />
        <MenuItem label="Delete" disabled />
      </Menu>

      <Menu accessibleLabel="Vibrant actions" variant="vibrant">
        <MenuHeadline label="Vibrant" />
        <MenuItem label="Copy" leadingIcon={iContentCopy} />
        <MenuItem
          label="Open API reference"
          href="/components/menu/api"
          target="_blank"
          trailingIcon={iOpenInNew}
        />
        <MenuItem label="Delete" disabled />
      </Menu>
    </div>
  );
}
