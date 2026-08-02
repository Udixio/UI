import { Slider } from '@udixio/ui-react';

export default function SliderDisabledReact() {
  return (
    <div className="w-72">
      <Slider
        name="volume"
        defaultValue={40}
        step={10}
        disabled
        aria-label="Volume (disabled)"
      />
    </div>
  );
}
