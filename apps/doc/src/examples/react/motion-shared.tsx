import { useState } from 'react';
import { useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

const PHOTOS = [1, 2, 3];

function Thumb({ id, onOpen }: { id: number; onOpen: () => void }) {
  // The thumbnail and the detail share a key: the detail grows out of the thumbnail, and back into it.
  const thumb = useMotion('reflow', {
    shared: `photo-${id}`,
  });

  return (
    <button
      ref={thumb.ref}
      type="button"
      onClick={onOpen}
      className="rounded-2xl bg-primary-container p-6 text-label-large text-on-primary-container"
    >
      Photo {id}
    </button>
  );
}

function Detail({ id, onClose }: { id: number; onClose: () => void }) {
  const detail = useMotion('reflow', {
    shared: `photo-${id}`,
  });

  return (
    <div
      ref={detail.ref}
      className="flex flex-col items-start gap-3 rounded-3xl bg-primary p-6 text-on-primary"
    >
      <p className="text-headline-small">Photo {id}</p>
      <button type="button" onClick={onClose} className="rounded-full bg-surface-container-high px-5 py-2 text-label-large text-on-surface">
        Close
      </button>
    </div>
  );
}

export function MotionSharedReact() {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {PHOTOS.filter((id) => id !== open).map((id) => (
          <Thumb key={id} id={id} onOpen={() => setOpen(id)} />
        ))}
      </div>
      {open !== 0 && <Detail id={open} onClose={() => setOpen(0)} />}
    </div>
  );
}
