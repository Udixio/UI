import { Menu, MenuHeadline, MenuItem } from '@udixio/ui-react';
import { iChevronRight } from '@udixio/icons-rounded-400/chevron_right';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iDelete } from '@udixio/icons-rounded-400/delete';
import { iSettings } from '@udixio/icons-rounded-400/settings';

export default function MenuVariantsReact() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-6">
      <Menu accessibleLabel="Standard actions">
        <MenuHeadline label="Standard" />
        <MenuItem label="Copy" leadingIcon={iContentCopy} />
        <MenuItem
          label="Settings"
          leadingIcon={iSettings}
          trailingIcon={iChevronRight}
        />
        <MenuItem label="Delete" leadingIcon={iDelete} disabled />
      </Menu>

      <Menu accessibleLabel="Vibrant actions" variant="vibrant">
        <MenuHeadline label="Vibrant" />
        <MenuItem label="Copy" leadingIcon={iContentCopy} />
        <MenuItem
          label="Settings"
          leadingIcon={iSettings}
          trailingIcon={iChevronRight}
        />
        <MenuItem label="Delete" leadingIcon={iDelete} disabled />
      </Menu>
    </div>
  );
}
