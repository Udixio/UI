import { Fab } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';

export default function FabVariantsReact() {
  return (
    <div className="grid grid-cols-3 items-end justify-items-end gap-4">
      <Fab label="Primary" icon={iAdd} variant="primary" extended />
      <Fab label="Secondary" icon={iAdd} variant="secondary" extended />
      <Fab label="Tertiary" icon={iAdd} variant="tertiary" extended />
      <Fab
        label="Primary container"
        icon={iAdd}
        variant="primaryContainer"
        extended
      />
      <Fab
        label="Secondary container"
        icon={iAdd}
        variant="secondaryContainer"
        extended
      />
      <Fab
        label="Tertiary container"
        icon={iAdd}
        variant="tertiaryContainer"
        extended
      />
    </div>
  );
}
