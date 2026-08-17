import { useState } from 'react';
import { Chips, type ChipItem } from '@udixio/ui-react';

export default function ChipsListReact() {
  const [items, setItems] = useState<ChipItem[]>([{ id: 'photos', label: 'Photos', selected: true }, { id: 'videos', label: 'Videos', removable: true }]);
  return <Chips label="Media filters" items={items} onItemsChange={setItems} />;
}
