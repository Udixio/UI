import { useEffect, useRef, useState } from 'react';
import { animateStyle, createSpring, type SpringNumber } from '@udixio/motion/animate';

const STATES = [
  { backgroundColor: 'var(--color-primary-container)', borderRadius: '28px', clipPath: 'inset(0% round 28px)' },
  { backgroundColor: 'var(--color-tertiary-container)', borderRadius: '8px', clipPath: 'inset(6% 4% round 8px)' },
];

export function MotionAnimateReact() {
  const card = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const offset = useRef<SpringNumber>(undefined);
  const [state, setState] = useState(0);

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
    <>
      <div ref={card}>Next state</div>
      <button type="button" onClick={next}>
        Next state
      </button>
      <input
        type="range"
        min="0"
        max="300"
        defaultValue="0"
        aria-label="Position"
        onChange={(event) => offset.current?.to(Number(event.target.value))}
      />
      <span ref={dot} />
    </>
  );
}
