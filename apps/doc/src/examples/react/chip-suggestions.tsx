import { Chip } from '@udixio/ui-react';

export default function ChipSuggestionsReact() {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip label="Near me" />
      <Chip label="Open now" variant="elevated" />
      <Chip label="4★ and up" />
    </div>
  );
}
