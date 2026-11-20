import { useState } from 'react';
import { Button, Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

const PHOTOS = [1, 2, 3];

export function MotionSharedReact() {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {/* The thumbnail and the detail share a key: the detail grows out of the thumbnail, and back into it.
            The thumbnail is the element that moves, so it stays a plain button rather than a Udixio Button. */}
        {PHOTOS.filter((id) => id !== open).map((id) => (
          <Motion
            key={id}
            as="button"
            name="reflow"
            shared={`photo-${id}`}
            type="button"
            onClick={() => setOpen(id)}
            className="rounded-2xl bg-primary-container p-6 text-label-large text-on-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
          >
            Photo {id}
          </Motion>
        ))}
      </div>
      {open !== 0 && (
        <Motion
          as="div"
          name="reflow"
          shared={`photo-${open}`}
          className="flex flex-col items-start gap-3 rounded-3xl bg-primary p-6 text-on-primary"
        >
          <p className="text-headline-small">Photo {open}</p>
          <Button size="small" variant="tonal" label="Close" onClick={() => setOpen(0)} />
        </Motion>
      )}
    </div>
  );
}
