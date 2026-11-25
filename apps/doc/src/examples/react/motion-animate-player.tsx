import { useRef, useState } from 'react';
import { animateStyle } from '@udixio/motion/animate';
import { Button } from '@udixio/ui-react';

const TRACKS = ['Night Drive', 'Signal Fire', 'Open Road'];
// The colours, the corners and the clip of the player are not motion fields: animateStyle animates them.
const STATES = [
  {
    backgroundColor: 'var(--color-primary-container)',
    color: 'var(--color-on-primary-container)',
    borderRadius: '24px',
    clipPath: 'inset(0% round 24px)',
  },
  {
    backgroundColor: 'var(--color-tertiary-container)',
    color: 'var(--color-on-tertiary-container)',
    borderRadius: '8px',
    clipPath: 'inset(6% 4% round 8px)',
  },
  {
    backgroundColor: 'var(--color-secondary-container)',
    color: 'var(--color-on-secondary-container)',
    borderRadius: '20px',
    clipPath: 'inset(3% 0% round 20px)',
  },
];

export function MotionAnimatePlayerReact() {
  const player = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // A single keyframe starts from the current style of the player, so the change goes on from where it is.
  const next = () => {
    const to = (index + 1) % TRACKS.length;
    setIndex(to);
    animateStyle(player.current!, STATES[to]!, {
      timing: 'spring.default.effects',
    });
  };

  return (
    <div className="flex w-full max-w-72 flex-col items-start gap-4">
      <div
        ref={player}
        className="flex h-24 w-full items-center rounded-3xl bg-primary-container px-5 text-title-medium text-on-primary-container"
      >
        {TRACKS[index]}
      </div>
      <Button size="small" label="Next track" onClick={next} />
    </div>
  );
}
