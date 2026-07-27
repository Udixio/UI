import { Chip } from '@udixio/ui-react';

export default function ChipSuggestionsReact() {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip label="Près de moi" />
      <Chip label="Ouvert maintenant" variant="elevated" />
      <Chip label="4★ et +" />
    </div>
  );
}
