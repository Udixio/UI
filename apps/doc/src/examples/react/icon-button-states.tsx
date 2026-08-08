import { IconButton } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';

export default function IconButtonStatesReact() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton label="Add item" icon={iAdd} />
      <IconButton label="Disabled action" icon={iAdd} disabled />
    </div>
  );
}
