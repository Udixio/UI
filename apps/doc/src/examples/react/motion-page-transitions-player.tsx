import { useState } from 'react';
import { flushSync } from 'react-dom';
import { navigate, type NavigationDirection } from '@udixio/motion/page';
import { Button } from '@udixio/ui-react';

const TRACKS = ['Night Drive', 'Signal Fire', 'Open Road'];

export function MotionPageTransitionsPlayerReact() {
  const [view, setView] = useState<'library' | 'player'>('library');
  const toPlayer = view === 'library';

  // The change of view runs inside the transition. flushSync draws the new view before the browser takes its picture.
  const go = () => {
    const direction: NavigationDirection = toPlayer ? 'forward' : 'back';
    navigate(() => flushSync(() => setView(toPlayer ? 'player' : 'library')), { direction });
  };

  return (
    <div className="flex w-full max-w-72 flex-col items-start gap-4">
      {toPlayer ? (
        <ul className="flex w-full flex-col gap-2">
          {TRACKS.map((track) => (
            <li key={track} className="rounded-2xl bg-surface-container-highest px-4 py-3 text-body-large text-on-surface">
              {track}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex w-full flex-col gap-2 rounded-3xl bg-tertiary-container p-5 text-on-tertiary-container">
          <span className="text-label-large">Now playing</span>
          <span className="text-title-large">Night Drive</span>
        </div>
      )}
      <Button size="small" label={toPlayer ? 'Open the player' : 'Back to the library'} onClick={go} />
    </div>
  );
}
