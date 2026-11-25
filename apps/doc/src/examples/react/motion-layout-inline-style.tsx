import { useState } from 'react';
import { Button, Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionLayoutInlineStyleReact() {
  const [wide, setWide] = useState(false);

  return (
    <div className="flex w-full max-w-88 flex-col items-start gap-4">
      {/* The layout does not observe the inline style: a new state plays the move, once the width is written. */}
      <Motion
        name="reflow"
        state={wide}
        style={{ width: wide ? '100%' : '60%' }}
        className="rounded-3xl bg-primary-container px-5 py-4 text-on-primary-container"
      >
        Widen me
      </Motion>
      <Button size="small" label="Widen" onClick={() => setWide((value) => !value)} />
    </div>
  );
}
