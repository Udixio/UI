import { useRef, useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { morph } from '@udixio/motion/svg';
import { Button, Motion } from '@udixio/ui-react';

// The check is drawn once, when it enters the view.
defineMotion('check-draw', {
  verb: 'reveal',
  keyframes: [{ draw: 0 }, { draw: 1 }],
  timing: {
    duration: 'duration.extraLong1',
    easing: 'easing.standard',
  },
});

const PLAY = 'M8 5 L19 12 L8 19 Z';
const PAUSE = 'M7 5 H10 V19 H7 Z M14 5 H17 V19 H14 Z';

export function MotionSvgReact() {
  const icon = useRef<SVGPathElement>(null);
  const morphing = useRef<ReturnType<typeof morph> | undefined>(undefined);
  const [pressed, setPressed] = useState(false);

  // A new morph continues from the shape the icon has reached.
  const toggle = (next: boolean) => {
    setPressed(next);
    if (!icon.current) return;
    morphing.current?.cancel();
    morphing.current = morph(icon.current, next ? PAUSE : PLAY, {
      timing: 'spring.default.spatial',
    });
  };

  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex items-center gap-6">
        <svg
          viewBox="0 0 48 48"
          className="size-20 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          aria-hidden="true"
        >
          <Motion
            as="path"
            name="check-draw"
            d="M44 24A20 20 0 1 1 4 24A20 20 0 1 1 44 24Z M16 25L22 31L33 19"
          />
        </svg>
        <svg
          viewBox="0 0 24 24"
          className="size-16 text-primary"
          fill="currentColor"
          aria-hidden="true"
        >
          <path ref={icon} d={PLAY} />
        </svg>
      </div>
      <Button
        size="small"
        toggleable
        pressed={pressed}
        onPressedChange={toggle}
        label="Morph"
      />
    </div>
  );
}
