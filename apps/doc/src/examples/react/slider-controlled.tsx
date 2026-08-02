import { useState } from 'react';
import { Slider } from '@udixio/ui-react';

export default function SliderControlledReact() {
  const [value, setValue] = useState(50);

  return (
    <div className="flex w-72 flex-col gap-4">
      <Slider
        name="brightness"
        value={value}
        step={10}
        onChange={setValue}
        aria-label="Brightness"
      />
      <p className="text-body-medium">Value: {value}</p>
    </div>
  );
}
