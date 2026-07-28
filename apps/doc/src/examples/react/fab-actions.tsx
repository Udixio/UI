import { Fab } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iShare } from '@udixio/icons-rounded-400/share';

export default function FabActionsReact() {
  return (
    <div className="grid w-full gap-8">
      <section className="grid gap-3">
        <h3 className="text-title-medium">Color families</h3>
        <div className="flex flex-wrap items-end gap-4">
          <Fab label="Primary" icon={iAdd} variant="primary" />
          <Fab label="Secondary" icon={iShare} variant="secondary" />
          <Fab label="Tertiary" icon={iAdd} variant="tertiary" />
          <Fab
            label="Primary container"
            icon={iAdd}
            variant="primaryContainer"
            extended
          />
          <Fab
            label="Secondary container"
            icon={iShare}
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
      </section>

      <section className="grid gap-3">
        <h3 className="text-title-medium">Sizes and states</h3>
        <div className="flex flex-wrap items-end gap-4">
          <Fab label="Small" icon={iAdd} size="small" />
          <Fab label="Medium" icon={iAdd} size="medium" />
          <Fab label="Large" icon={iAdd} size="large" />
          <Fab label="Disabled action" icon={iAdd} disabled extended />
        </div>
      </section>
    </div>
  );
}
