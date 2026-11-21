import { useRef, useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { morph } from '@udixio/motion/svg';
import { Button, useMotion } from '@udixio/ui-react';

// A reveal: the check is drawn once, when it enters the view. play() draws it again from nothing.
defineMotion('check-draw', {
  verb: 'reveal',
  keyframes: [{ draw: 0 }, { draw: 1 }],
  timing: {
    duration: 'duration.extraLong1',
    easing: 'easing.standard',
  },
});
// The dot starts at the start of its offset path, and travels to its end.
defineMotion('travel', {
  verb: 'reveal',
  keyframes: [{ along: 0 }, { along: 1 }],
  timing: {
    duration: 'duration.extraLong2',
    easing: 'easing.standard',
  },
});

const PLAY = 'M8 5 L19 12 L8 19 Z';
const PAUSE = 'M7 5 H10 V19 H7 Z M14 5 H17 V19 H14 Z';

export function MotionSvgReact() {
  const check = useMotion<SVGPathElement>('check-draw');
  const dot = useMotion<HTMLSpanElement>('travel');
  const icon = useRef<SVGPathElement>(null);
  const [pressed, setPressed] = useState(false);
  const morphing = useRef<ReturnType<typeof morph> | undefined>(undefined);

  // The toggle hands over the new state: the icon morphs to the pause shape, or back to the play shape.
  const toggle = (next: boolean) => {
    setPressed(next);
    if (!icon.current) return;
    // A new morph continues from the shape the icon has reached.
    morphing.current?.cancel();
    morphing.current = morph(icon.current, next ? PAUSE : PLAY, { timing: 'spring.default.spatial' });
  };

  return (
    <div className="flex flex-col items-start gap-6">
      <svg
        viewBox="0 0 48 48"
        className="size-20 text-primary"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        aria-hidden="true"
      >
        <path
          ref={check.ref}
          d="M44 24A20 20 0 1 1 4 24A20 20 0 1 1 44 24Z M16 25L22 31L33 19"
        />
      </svg>
      <Button size="small" label="Draw again" onClick={() => check.play()} />
      <span
        ref={dot.ref}
        className="size-4 rounded-full bg-primary"
        style={{ offsetPath: "path('M16 56C56 8 112 8 152 56')", offsetDistance: '100%' }}
      />
      <Button size="small" label="Move again" onClick={() => dot.play()} />
      <svg viewBox="0 0 24 24" className="size-16 text-primary" fill="currentColor" aria-hidden="true">
        <path ref={icon} d={PLAY} />
      </svg>
      <Button size="small" toggleable pressed={pressed} onPressedChange={toggle} label="Morph" />
    </div>
  );
}
