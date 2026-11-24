import { useRef, useState } from 'react';
import { Button, Motion, type MotionControls } from '@udixio/ui-react';
import '@udixio/motion/presets';

// Two ways to replay a press on a Udixio Button. <Motion as={Button}> renders the Button itself and takes its props: the
// press moves the Button's own <button>, with no wrapper box around it.
export function SaveAndShare() {
  // Each new value of state replays the press.
  const [saves, setSaves] = useState(0);
  // motionRef gives play(), to replay from a handler. ref would stay the Button's own ref.
  const share = useRef<MotionControls>(null);

  return (
    // gap spaces the buttons: a structural utility such as space-x-4 would not reach them.
    <div className="flex flex-wrap items-center gap-4">
      <Motion
        as={Button}
        name="press"
        state={saves}
        size="small"
        label="Save"
        onClick={() => setSaves((value) => value + 1)}
      />
      <Motion
        as={Button}
        name="press"
        motionRef={share}
        size="small"
        variant="tonal"
        label="Share"
        onClick={() => share.current?.play()}
      />
    </div>
  );
}
