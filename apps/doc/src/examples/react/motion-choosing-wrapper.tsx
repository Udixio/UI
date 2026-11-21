import { useState } from 'react';
import { Button, Motion, useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// Two ways to press a Udixio Button. Both put the motion on a plain wrapper: the Button's ref reaches its native
// <button>, and <Motion as> renders an HTML element, not a component.
export function SaveAndShare() {
  // <Motion> renders the wrapper itself, and replays the press each time state changes.
  const [saves, setSaves] = useState(0);
  // useMotion gives a ref for an element you render, and play() to replay from a handler.
  const share = useMotion('press');

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Motion as="span" name="press" state={saves} className="inline-flex">
        <Button size="small" label="Save" onClick={() => setSaves((value) => value + 1)} />
      </Motion>
      {/* inline-flex gives the wrapper a box of its own: a transform does nothing on a plain inline span. */}
      <span ref={share.ref} className="inline-flex">
        <Button size="small" variant="tonal" label="Share" onClick={() => share.play()} />
      </span>
    </div>
  );
}
