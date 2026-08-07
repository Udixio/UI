import { Button, Tooltip } from '@udixio/ui-react';

export default function TooltipRichReact() {
  return (
    <div className="flex flex-wrap items-center gap-6 p-8">
      <Tooltip
        variant="rich"
        title="Saved"
        text="Item added to favorites"
        buttons={[{ label: 'Undo' }]}
      >
        <Button label="Rich tooltip" />
      </Tooltip>
      <Tooltip
        variant="rich"
        content={
          <div>
            <strong className="text-title-small">Shortcuts</strong>
            <p className="text-body-medium">Press Cmd+K to open the command palette.</p>
          </div>
        }
      >
        <Button label="Custom content" />
      </Tooltip>
    </div>
  );
}
