import { useState } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

const TRACKS = ['Night drive', 'Glass city', 'Low tide', 'Harbour', 'Afterglow', 'Halfway', 'Paper moon'];

type Track = { id: number; title: string };

let lastId = 5;

export function MotionListsReact() {
  const [queue, setQueue] = useState<Track[]>([
    { id: 1, title: 'Intro' },
    { id: 2, title: 'Morning' },
    { id: 3, title: 'Harbour' },
    { id: 4, title: 'Afterglow' },
    { id: 5, title: 'Halfway' },
  ]);

  const addThree = () => {
    const three = [0, 1, 2].map(() => {
      lastId += 1;
      return { id: lastId, title: TRACKS[lastId % TRACKS.length] };
    });
    // Added in one render at the bottom: the three cascade in, and past five the oldest leave from the top.
    setQueue((list) => [...list, ...three].slice(-5));
  };

  return (
    <div className="flex w-full max-w-80 flex-col items-start gap-4">
      <Button size="small" label="Add three" onClick={addThree} />
      <p className="text-title-small text-on-surface">Up next</p>
      <ul className="flex w-full flex-col gap-2">
        {/* The Presence keeps a leaving track until its exit has played; the tracks below it close the gap. */}
        <Presence>
          {queue.map((track) => (
            <Motion
              key={track.id}
              as="li"
              name="cascade reflow"
              className="rounded-2xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface"
            >
              {track.title}
            </Motion>
          ))}
        </Presence>
      </ul>
    </div>
  );
}
