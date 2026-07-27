import { Chip } from '@udixio/ui-react';

export default function ChipActionsReact() {
  return (
    <div className="flex flex-wrap gap-3">
      <Chip label="Action" onClick={() => console.info('Action')} />
      <Chip label="Documentation" href="/components/chip" />
    </div>
  );
}
