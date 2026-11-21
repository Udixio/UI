import { useEffect, useRef, useState } from 'react';
import { animateStyle, createSpring, type SpringNumber } from '@udixio/motion/animate';
import { Button, Slider } from '@udixio/ui-react';

const STATES = [
  { backgroundColor: 'var(--color-primary-container)', borderRadius: '28px', clipPath: 'inset(0% round 28px)' },
  { backgroundColor: 'var(--color-tertiary-container)', borderRadius: '8px', clipPath: 'inset(6% 4% round 8px)' },
];

export function MotionAnimateCardDotReact() {
  const card = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const offset = useRef<SpringNumber>(undefined);
  const [state, setState] = useState(0);

  // The spring lives as long as the component: its cleanup stops it when the component unmounts.
  useEffect(() => {
    offset.current = createSpring(0, {
      timing: 'spring.default.spatial',
      onUpdate: (value) => {
        dot.current!.style.translate = `${value}px 0`;
      },
    });
    return () => offset.current?.stop();
  }, []);

  // A single keyframe starts from the current style of the card.
  const next = () => {
    const to = (state + 1) % STATES.length;
    setState(to);
    animateStyle(card.current!, STATES[to]!, {
      timing: 'spring.default.effects',
    });
  };

  return (
    <div className="flex w-full max-w-72 flex-col items-start gap-4">
      <div
        ref={card}
        className="flex h-24 w-full items-center justify-center rounded-3xl bg-surface-container-high text-title-medium text-on-surface"
      >
        Next state
      </div>
      <Button size="small" label="Next state" onClick={next} />
      {/* The slider moves the dot: a spring follows its value. */}
      <Slider
        aria-label="Position"
        min={0}
        max={300}
        step={1}
        defaultValue={0}
        onChange={(value) => offset.current?.to(value)}
      />
      <span ref={dot} className="block size-4 rounded-full bg-primary" />
    </div>
  );
}
