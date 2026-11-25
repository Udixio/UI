import { useState } from 'react';
import { Button, Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionLayoutReact() {
  const [open, setOpen] = useState(false);

  return (
    <div data-motion-scope className="flex w-full max-w-88 flex-col">
      {/* A class is observed: the layout moves the player from its old size to its new one, with no call of your own. */}
      <Motion
        name="reflow"
        data-open={open || undefined}
        className="flex h-16 flex-row items-center gap-3 rounded-3xl bg-surface-container-high px-3 data-[open]:h-64 data-[open]:flex-col data-[open]:items-start data-[open]:justify-between data-[open]:gap-4 data-[open]:p-5"
      >
        <span className="size-10 shrink-0 rounded-xl bg-tertiary-container" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-title-medium text-on-surface">Night drive</span>
          <span className="text-body-small text-on-surface-variant">Low tide</span>
        </span>
        <Button size="small" label={open ? 'Close' : 'Open'} onClick={() => setOpen((value) => !value)} />
      </Motion>
    </div>
  );
}
