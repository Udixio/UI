import { useLayoutEffect, useState } from 'react';
import { Button, useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function ReplayTwoWays() {
  const [wide, setWide] = useState(false);
  // play() replays an emphasis or a reveal: the press of the button.
  const press = useMotion('press');
  // A layout is not replayed by play(): getBinding('layout') gives its binding, whose play() moves it now.
  const card = useMotion<HTMLDivElement>('reflow');

  // An inline style is not observed: once React has written the new width, ask the layout to move.
  useLayoutEffect(() => {
    card.getBinding('layout')?.play();
  }, [wide]);

  return (
    <div className="flex w-full flex-col items-start gap-4">
      <span ref={press.ref} className="inline-flex">
        <Button
          size="small"
          label={wide ? 'Narrow' : 'Widen'}
          onClick={() => {
            press.play();
            setWide((value) => !value);
          }}
        />
      </span>
      <div ref={card.ref} style={{ width: wide ? '100%' : '50%' }} className="rounded-2xl bg-surface-container-high p-4">
        Now playing
      </div>
    </div>
  );
}
