import { useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// A scrub: the card moves against the scroll as it crosses the viewport. A browser without a view timeline keeps it in place.
type CardProps = { title: string };

function Card({ title }: CardProps) {
  const card = useMotion('parallax');
  return (
    <article
      ref={card.ref}
      className="rounded-3xl bg-tertiary-container px-5 py-4 text-title-small text-on-tertiary-container"
    >
      {title}
    </article>
  );
}

export function MotionScrubReact() {
  return (
    <div className="flex w-full max-w-[22rem] flex-col gap-10">
      <Card title="Moves against the scroll" />
      <Card title="Moves against the scroll, too" />
    </div>
  );
}
