import { useRef } from 'react';
import { scrollTo } from '@udixio/motion/scroll';
import { Button } from '@udixio/ui-react';

const TRACKS = [
  'Glass Harbour',
  'Low Tide',
  'Paper Moon',
  'Slow Current',
  'Afterglow',
  'Night Drive',
  'Signal Fire',
  'Open Road',
  'Dust and Sea',
  'Lantern',
];
const CURRENT = 5;

export function MotionScrollReact() {
  const queue = useRef<HTMLDivElement>(null);
  const current = useRef<HTMLLIElement>(null);

  // The queue scrolls to the current track, and the track takes the focus when it arrives.
  const toCurrent = () => {
    scrollTo(current.current!, {
      container: queue.current!,
      focus: true,
    });
  };

  return (
    <div className="flex w-full max-w-72 flex-col items-start gap-4">
      <div
        ref={queue}
        role="region"
        aria-label="Queue"
        tabIndex={0}
        className="h-56 w-full overflow-y-auto rounded-3xl bg-surface-container p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        <ol>
          {TRACKS.map((track, index) => (
            <li
              key={track}
              ref={index === CURRENT ? current : undefined}
              className={
                index === CURRENT
                  ? 'flex h-14 items-center justify-between gap-2 whitespace-nowrap rounded-2xl bg-primary-container px-4 text-body-large text-on-primary-container'
                  : 'flex h-14 items-center rounded-2xl px-4 text-body-large text-on-surface'
              }
            >
              {track}
              {index === CURRENT && <span className="text-label-medium whitespace-nowrap">Now playing</span>}
            </li>
          ))}
        </ol>
      </div>
      <Button size="small" label="Go to the current track" onClick={toCurrent} />
    </div>
  );
}
