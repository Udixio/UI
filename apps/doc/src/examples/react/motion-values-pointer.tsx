import { useState } from 'react';
import { defineValue } from '@udixio/motion/value';
import { Slider, useMotionValue } from '@udixio/ui-react';

// One value on both axes, in degrees: the card's CSS reads each channel with its unit.
defineValue('tilt', { source: 'pointer', axis: 'both', range: [-8, 8], unit: 'deg' });
// A state value: the slider sets it, and the gauge scales with it.
defineValue('level', { source: 'state', range: [0, 1] });

export function MotionValuesPointerReact() {
  const [level, setLevel] = useState(0.6);
  // Each ref writes its value on its element: the card turns with the pointer, and the gauge fills with the level.
  const tilt = useMotionValue('tilt');
  const gauge = useMotionValue('level');

  return (
    <div className="flex w-full max-w-72 flex-col gap-6">
      {/* The vertical channel is negated, so the card sinks under the pointer on both axes. */}
      <div
        ref={tilt.ref}
        className="rounded-3xl bg-primary-container p-5 text-on-primary-container [transform:perspective(600px)_rotateY(var(--udx-motion-value-tilt-x-deg,0deg))_rotateX(calc(var(--udx-motion-value-tilt-y-deg,0deg)_*_-1))] motion-reduce:[transform:none]"
      >
        <p className="text-title-large">Move over this card</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-label-large text-on-surface">Level</span>
        <div className="min-w-0 flex-1">
          <Slider aria-label="Level" min={0} max={1} step={0.01} value={level} onChange={setLevel} />
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface-container-highest">
        <data
          ref={gauge.ref}
          value={level}
          className="block h-full w-full origin-left rounded-full bg-primary [scale:var(--udx-motion-value-level,0)_1]"
        />
      </div>
    </div>
  );
}
