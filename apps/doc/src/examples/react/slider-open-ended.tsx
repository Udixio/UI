import { Slider } from '@udixio/ui-react';

const marks = [
  { value: -Infinity, label: 'Min' },
  { value: 0, label: '0' },
  { value: 100, label: '100' },
  { value: Infinity, label: 'Max' },
];

export default function SliderOpenEndedReact() {
  return (
    <div className="w-72">
      <Slider
        name="range"
        defaultValue={0}
        min={-Infinity}
        max={Infinity}
        marks={marks}
        aria-label="Open-ended range"
      />
    </div>
  );
}
