import { useState } from 'react';
import { Chip } from '@udixio/ui-react';

export default function ChipEditingReact() {
  const [label, setLabel] = useState('Double-cliquez pour modifier');

  return <Chip label={label} editable onEditCommit={setLabel} />;
}
