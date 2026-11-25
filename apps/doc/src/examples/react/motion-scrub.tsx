import { Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

// A scrub: the cards move against the scroll as they cross the viewport.
export function MotionScrubReact() {
  return (
    <div className="flex w-full max-w-[22rem] flex-col gap-10">
      <Motion
        as="article"
        name="parallax"
        className="rounded-3xl bg-tertiary-container px-5 py-4 text-title-small text-on-tertiary-container"
      >
        Now playing: Lowlands
      </Motion>
      <Motion
        as="article"
        name="parallax"
        className="rounded-3xl bg-tertiary-container px-5 py-4 text-title-small text-on-tertiary-container"
      >
        Up next: Ember Tide
      </Motion>
    </div>
  );
}
