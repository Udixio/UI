import { IconButton } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';

export default function IconButtonSizesReact() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton variant="filled" label="Extra small" icon={iAdd} size="xSmall" />
      <IconButton variant="filled" label="Small" icon={iAdd} size="small" />
      <IconButton variant="filled" label="Medium" icon={iAdd} size="medium" />
      <IconButton variant="filled" label="Large" icon={iAdd} size="large" />
      <IconButton variant="filled" label="Extra large" icon={iAdd} size="xLarge" />
    </div>
  );
}
