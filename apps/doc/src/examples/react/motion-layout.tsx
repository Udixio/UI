import { useState } from 'react';
import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionLayoutReact() {
  const [wide, setWide] = useState(false);
  const [end, setEnd] = useState(false);
  const [rows, setRows] = useState(['Build', 'Review', 'Release']);

  return (
    <div data-motion-scope className="flex w-full max-w-88 flex-col gap-3">
      {/* The reflow preset is a layout motion: an element moves to its new place when its neighbours change. The width
          and the side are observed as they are: an attribute and a class are changes the layout follows. */}
      <Motion
        name="reflow"
        data-wide={wide || undefined}
        className="w-[60%] rounded-3xl bg-primary-container px-5 py-4 text-on-primary-container data-[wide]:w-full"
      >
        Widen me
      </Motion>
      <Motion name="reflow" className={`flex ${end ? 'justify-end' : 'justify-start'}`}>
        <span className="rounded-full bg-secondary-container px-4 py-2 text-label-large text-on-secondary-container">
          Start · End
        </span>
      </Motion>
      <ul className="flex flex-col gap-2">
        {rows.map((label) => (
          <Motion
            key={label}
            as="li"
            name="reflow"
            className="rounded-xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface"
          >
            {label}
          </Motion>
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
