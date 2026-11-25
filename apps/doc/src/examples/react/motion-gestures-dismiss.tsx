import { useState } from 'react';
import { defineGesture } from '@udixio/motion/gesture';
import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// A swipe flies the track out, hidden from assistive
// technology. Keep afterFlyOut at its default, hide: the
// state removes the track, and React takes it out of the
// page. A focused track hands the focus to the next track
// as it flies out, by itself.
defineGesture('dismiss', { type: 'swipe' });

const TRACKS = ['Night Drive', 'Signal Fire', 'Open Road'];

export function QueueList() {
  const [tracks, setTracks] = useState(TRACKS);
  const complete = (track: string) =>
    setTracks((list) => list.filter((item) => item !== track));

  return (
    <ul className="flex w-full max-w-88 flex-col gap-2">
      {tracks.map((track) => (
        // reflow closes the gap that a removed track leaves; the swipe removes the track, and onMotionSwipe removes it.
        <Motion
          key={track}
          as="li"
          name="reflow"
          gesture="dismiss"
          onMotionSwipe={() => complete(track)}
          className="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
        >
          {track}
        </Motion>
      ))}
    </ul>
  );
}
