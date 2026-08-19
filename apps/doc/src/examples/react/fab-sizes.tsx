import { Fab } from '@udixio/ui-react';
import { iEdit } from '@udixio/icons-rounded-400/edit';

export default function FabSizesReact() {
  return (
    <div className="flex flex-wrap items-end justify-end gap-4">
      <Fab label="Small" icon={iEdit} size="small" />
      <Fab label="Medium" icon={iEdit} size="medium" />
      <Fab label="Large" icon={iEdit} size="large" />
    </div>
  );
}
