import { useState } from 'react';
import { Slider } from '@udixio/ui-react';

export default function SliderBasicReact() {
  const [value, setValue] = useState(30);

  return (
    <div className="flex w-72 flex-col gap-4">
      <Slider
        name="volume"
        defaultValue={30}
        step={10}
        onChange={setValue}
        aria-label="Volume"
      />
      <p className="text-body-medium">Value: {value}</p>
    </div>
  );
}
