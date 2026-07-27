import { useState } from 'react';
import { Chips } from '@udixio/ui-react';

export default function ChipsListReact() {
  const [items, setItems] = useState([{ id: 'photos', label: 'Photos', selected: true }, { id: 'videos', label: 'Videos', removable: true }]);
  return <Chips label="Media filters" items={items} onItemsChange={setItems} />;
}
