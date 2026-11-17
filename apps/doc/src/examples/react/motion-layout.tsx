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
  const [rows, setRows] = useState(['One', 'Two', 'Three']);

  return (
    <div className="flex flex-col items-start gap-4">
      <button
        type="button"
        onClick={() => setRows(([first, ...rest]) => [...rest, first])}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Move first to end
      </button>
      <ul className="flex w-64 flex-col gap-2">
        {rows.map((label) => (
          <Row key={label} label={label} />
        ))}
      </ul>
    </div>
  );
}
