import { useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

const TITLES = ['Release notes', 'Design review', 'Build passed', 'New comment', 'Room booked', 'Invoice sent'];

// A card rises once, as it enters the view of the feed: until then it waits in its first frame.
type CardProps = { title: string };

function Card({ title }: CardProps) {
  const card = useMotion('rise');
  return (
    <li
      ref={card.ref}
      className="rounded-2xl bg-surface-container-high px-4 py-3 text-title-small text-on-surface"
    >
      {title}
    </li>
  );
}

export function MotionRevealReact() {
  return (
    <ol
      tabIndex={0}
      aria-label="Feed"
      className="flex h-64 w-full max-w-[22rem] flex-col gap-2 overflow-y-auto rounded-2xl bg-surface-container p-3"
    >
      {TITLES.map((title) => (
        <Card key={title} title={title} />
      ))}
    </ol>
  );
}
