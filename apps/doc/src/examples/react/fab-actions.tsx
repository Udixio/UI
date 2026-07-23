import { Fab } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iShare } from '@udixio/icons-rounded-400/share';

export default function FabActionsReact() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <Fab label="Create" icon={iAdd} />
      <Fab label="Share" icon={iShare} extended variant="secondary" />
      <Fab label="Disabled action" icon={iAdd} disabled />
    </div>
  );
}
