import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

const TRACKS = [
  { title: 'Intro', length: '1:12' },
  { title: 'Night drive', length: '3:48' },
  { title: 'Glass city', length: '4:05' },
  { title: 'Low tide', length: '3:21' },
  { title: 'Harbour', length: '4:40' },
  { title: 'Afterglow', length: '3:55' },
  { title: 'Halfway', length: '2:58' },
  { title: 'Paper moon', length: '4:12' },
];

export function MotionRevealReact() {
  return (
    <ol
      tabIndex={0}
      aria-label="Tracks"
      className="flex h-64 w-full max-w-88 flex-col gap-2 overflow-y-auto rounded-3xl bg-surface-container p-3"
    >
      {/* Each track rises once, as it enters the view of the list: until then it waits in its first frame. */}
      {TRACKS.map((track) => (
        <Motion
          key={track.title}
          as="li"
          name="rise"
          className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high px-4 py-3"
        >
          <span className="text-title-small text-on-surface">{track.title}</span>
          <span className="text-body-medium text-on-surface-variant">{track.length}</span>
        </Motion>
      ))}
    </ol>
  );
}
