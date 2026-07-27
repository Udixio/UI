import { Chip } from '@udixio/ui-react';

export default function ChipDisabledReact() {
  return (
    <div className="flex flex-wrap gap-3">
      <Chip label="Indisponible" disabled />
      <Chip label="Lien indisponible" href="/components/chip" disabled />
    </div>
  );
}
