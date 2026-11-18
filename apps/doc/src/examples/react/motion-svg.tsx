import { useRef, useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { morph } from '@udixio/motion/svg';
import { useMotion } from '@udixio/ui-react';

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

  const toggle = () => {
    const next = !pressed;
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
      <button
        type="button"
        onClick={check.play}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary"
      >
        Draw again
      </button>
      <span
        ref={dot.ref}
        className="size-4 rounded-full bg-primary"
        style={{ offsetPath: "path('M16 72C96 0 192 0 272 72')", offsetDistance: '100%' }}
      />
      <button
        type="button"
        onClick={dot.play}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary"
      >
        Move again
      </button>
      <svg viewBox="0 0 24 24" className="size-16 text-primary" fill="currentColor" aria-hidden="true">
        <path ref={icon} d={PLAY} />
      </svg>
      <button
        type="button"
        aria-pressed={pressed}
        onClick={toggle}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary"
      >
        Morph
      </button>
    </div>
  );
}
