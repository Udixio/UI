import { defineMotion } from '@udixio/motion';
import { Motion } from '@udixio/ui-react';

// Only a reveal can replace a rise: not a presence.
defineMotion('fade-on-view', {
  verb: 'reveal',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
});

export function MotionScopesBreakpointsReact() {
  return (
    <section className="flex flex-col gap-3">
      {/* Each card rises; from md up, the second fades instead. */}
      <Motion as="article" name="rise">
        Plain
      </Motion>
      <Motion
        as="article"
        name="rise"
        className="md:motion-[fade-on-view]"
      >
        Fades from md
      </Motion>
      <Motion as="article" name="rise" className="motion-none">
        Off
      </Motion>
    </section>
  );
}
