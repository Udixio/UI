import { IconButton } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';

export default function IconButtonShapesReact() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <IconButton variant="filled" label="Narrow" icon={iAdd} shape="rounded" width="narrow" />
        <IconButton variant="filled" label="Default" icon={iAdd} shape="rounded" width="default" />
        <IconButton variant="filled" label="Wide" icon={iAdd} shape="rounded" width="wide" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <IconButton variant="filled" label="Narrow" icon={iAdd} shape="squared" width="narrow" />
        <IconButton variant="filled" label="Default" icon={iAdd} shape="squared" width="default" />
        <IconButton variant="filled" label="Wide" icon={iAdd} shape="squared" width="wide" />
      </div>
    </div>
  );
}
