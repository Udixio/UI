import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// A scrub: the card moves against the scroll as it crosses the viewport. A browser without a view timeline keeps it in place.
export function MotionScrubReact() {
  return (
    <div className="flex w-full max-w-[22rem] flex-col gap-10">
      <Motion
        as="article"
        name="parallax"
        className="rounded-3xl bg-tertiary-container px-5 py-4 text-title-small text-on-tertiary-container"
      >
        Moves against the scroll
      </Motion>
      <Motion
        as="article"
        name="parallax"
        className="rounded-3xl bg-tertiary-container px-5 py-4 text-title-small text-on-tertiary-container"
      >
        Moves against the scroll, too
      </Motion>
    </div>
  );
}
