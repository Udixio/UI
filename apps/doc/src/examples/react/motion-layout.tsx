import { useState } from 'react';
import { useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

function Row({ label }: { label: string }) {
  // The reflow preset is a layout motion: the row moves to its new place when its neighbours change.
  const row = useMotion<HTMLLIElement>('reflow');

  return (
    <li
      ref={row.ref}
      className="rounded-xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface"
    >
      {label}
    </li>
  );
}

export function MotionLayoutReact() {
  const [wide, setWide] = useState(false);
  const [end, setEnd] = useState(false);
  const [rows, setRows] = useState(['Build', 'Review', 'Release']);
  // The width and the side are observed as they are: an attribute and a class are changes the layout follows.
  const card = useMotion('reflow');
  const pill = useMotion('reflow');

  return (
    <div data-motion-scope className="flex w-full max-w-88 flex-col gap-3">
      <div
        ref={card.ref}
        data-wide={wide || undefined}
        className="w-[60%] rounded-3xl bg-primary-container px-5 py-4 text-on-primary-container data-[wide]:w-full"
      >
        Widen me
      </div>
      <div ref={pill.ref} className={`flex ${end ? 'justify-end' : 'justify-start'}`}>
        <span className="rounded-full bg-secondary-container px-4 py-2 text-label-large text-on-secondary-container">
          Start · End
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((label) => (
          <Row key={label} label={label} />
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setWide((value) => !value)} className="rounded-full bg-primary px-5 py-2 text-label-large text-on-primary">
          Widen
        </button>
        <button type="button" onClick={() => setEnd((value) => !value)} className="rounded-full bg-secondary-container px-5 py-2 text-label-large text-on-secondary-container">
          Start · End
        </button>
        <button type="button" onClick={() => setRows((list) => [...list].sort(() => Math.random() - 0.5))} className="rounded-full bg-secondary-container px-5 py-2 text-label-large text-on-secondary-container">
          Shuffle
        </button>
      </div>
    </div>
  );
}
