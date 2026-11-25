import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button, Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionSharedElementsReact() {
  const [open, setOpen] = useState(false);
  const cover = useRef<HTMLButtonElement>(null);
  const player = useRef<HTMLDivElement>(null);

  // The focus goes with the element that is shown: the player when it opens, the cover when it closes.
  const show = (next: boolean) => {
    flushSync(() => setOpen(next));
    (next ? player : cover).current?.focus();
  };

  // The cover and the player share a key: the player grows out of the cover, and back into it.
  return open ? (
    <Motion
      ref={player}
      as="div"
      name="reflow"
      shared="cover"
      tabIndex={-1}
      className="flex w-full max-w-72 flex-col items-start gap-4 rounded-3xl bg-tertiary-container p-5 text-on-tertiary-container"
    >
      <span className="size-40 rounded-2xl bg-tertiary" />
      <p className="text-title-large">Night drive</p>
      <p className="text-body-medium">Low tide</p>
      <Button size="small" variant="tonal" label="Close" onClick={() => show(false)} />
    </Motion>
  ) : (
    // The cover is the shared element itself: a native button, as in the HTML tab.
    <Motion
      ref={cover}
      as="button"
      name="reflow"
      shared="cover"
      type="button"
      aria-label="Open the player"
      onClick={() => show(true)}
      className="size-16 rounded-2xl bg-tertiary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
    />
  );
}
