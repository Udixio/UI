import { useRef } from 'react';
import { defineMotion } from '@udixio/motion';
import { Button, useMotion } from '@udixio/ui-react';
import { revert } from '@udixio/motion/scope';

// A reveal names a reveal: a presence such as `fade` would be ignored on a rise.
defineMotion('fade-on-view', {
  verb: 'reveal',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
});

export function MotionScopesReact() {
  const section = useRef<HTMLElement>(null);
  // Each card rises. The class of the second names `fade-on-view` from md up; the third names none.
  const plain = useMotion('rise');
  const fade = useMotion('rise');
  const off = useMotion('rise');

  return (
    <section ref={section} className="flex flex-col gap-3">
      <article ref={plain.ref}>Plain</article>
      <article
        ref={fade.ref}
        className="md:[--udx-motion:fade-on-view]"
      >
        Fades from md
      </article>
      <article ref={off.ref} className="[--udx-motion:none]">
        Off
      </article>
      <div className="flex flex-wrap gap-2">
        <Button size="small" label="Replay" onClick={() => [plain, fade, off].forEach((card) => card.play())} />
        {/* The motions under the section stop; its markup stays. */}
        <Button size="small" variant="outlined" label="Remove the motions" onClick={() => revert(section.current!)} />
      </div>
    </section>
  );
}
