import { Chip } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';

export default function ChipAssistReact() {
  return (
    <Chip
      label="Nouveau"
      icon={iAdd}
      onClick={() => console.info('Nouvelle action')}
    />
  );
}
