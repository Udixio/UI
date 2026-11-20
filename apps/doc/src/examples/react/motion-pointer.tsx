import { useState } from 'react';
import { defineValue } from '@udixio/motion/value';
import { Slider, useMotionValue } from '@udixio/ui-react';

// Two pointer values, one per axis, and a state value that the range sets.
defineValue('tilt-x', {
  source: 'pointer',
  axis: 'x',
  range: [-8, 8],
});
defineValue('tilt-y', {
  source: 'pointer',
  axis: 'y',
  range: [6, -6],
});
defineValue('level', {
  source: 'state',
  range: [0, 1],
});

export function MotionPointerReact() {
  const [level, setLevel] = useState(0.6);
  // Each value is bound to its own element: the outer card turns on y, the inner one on x.
  const tiltY = useMotionValue('tilt-y');
  const tiltX = useMotionValue('tilt-x');
  const gauge = useMotionValue('level');

  return (
    <div className="flex w-full max-w-72 flex-col gap-6">
      <div
        ref={tiltY.ref}
        style={{ transform: 'rotateX(calc(var(--udx-motion-value-tilt-y, 0) * 1deg))' }}
      >
        <div
          ref={tiltX.ref}
          className="rounded-3xl bg-primary-container p-5 text-on-primary-container"
          style={{ transform: 'rotateY(calc(var(--udx-motion-value-tilt-x, 0) * 1deg))' }}
        >
          <p className="text-title-large">Move over this card</p>
        </div>
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
