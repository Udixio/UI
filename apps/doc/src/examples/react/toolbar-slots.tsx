import { Button, IconButton, Toolbar } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iShare } from '@udixio/icons-rounded-400/share';

export default function ToolbarSlotsReact() {
  return (
    <Toolbar accessibleLabel="Project actions">
      <Button
        label="Publish"
        variant="filled"
        size="small"
        className="min-h-12"
      />
      <IconButton size="small" label="Add" icon={iAdd} />
      <IconButton size="small" label="Share" icon={iShare} />
      <img
        className="size-12 rounded-full object-cover"
        src="https://picsum.photos/seed/udixio-toolbar/48/48"
        alt="Project avatar"
      />
    </Toolbar>
  );
}
