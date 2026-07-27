import { useState } from 'react';
import { Chip } from '@udixio/ui-react';

export default function ChipStatesReact() {
  const [selected, setSelected] = useState(false);
  return (
    <Chip label="Photos" selected={selected} onSelectedChange={setSelected} />
  );
}
