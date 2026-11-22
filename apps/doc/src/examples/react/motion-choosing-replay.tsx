import { useState } from 'react';
import { Button, Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function ReplayFromState() {
  const [wide, setWide] = useState(false);

  // Each new state plays the first listed motion that
  // is not a presence: the press, and the layout, once
  // React has written the new width.
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <Motion as="span" name="press" state={wide} className="inline-flex">
        <Button
          size="small"
          label={wide ? 'Narrow' : 'Widen'}
          onClick={() => setWide((value) => !value)}
        />
      </Motion>
      <Motion
        name="reflow"
        state={wide}
        style={{ width: wide ? '100%' : '50%' }}
        className="rounded-2xl bg-surface-container-high p-4"
      >
        Now playing
      </Motion>
    </div>
  );
}
