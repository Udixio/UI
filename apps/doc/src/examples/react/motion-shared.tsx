import { useState } from 'react';
import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

const PHOTOS = [1, 2, 3];

export function MotionSharedReact() {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {/* The thumbnail and the detail share a key: the detail grows out of the thumbnail, and back into it. */}
        {PHOTOS.filter((id) => id !== open).map((id) => (
          <Motion
            key={id}
            as="button"
            name="reflow"
            shared={`photo-${id}`}
            type="button"
            onClick={() => setOpen(id)}
            className="rounded-2xl bg-primary-container p-6 text-label-large text-on-primary-container"
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
          <button type="button" onClick={() => setOpen(0)} className="rounded-full bg-surface-container-high px-5 py-2 text-label-large text-on-surface">
            Close
          </button>
        </Motion>
      )}
    </div>
  );
}
