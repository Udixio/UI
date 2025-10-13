import { ReactNode, useEffect, useState } from 'react';
import { motionValue, useMotionValueEvent, useSpring } from 'motion/react';
import { CustomScrollInterface } from './custom-scroll';
import { ReactProps } from '../utils';
import { BlockScroll } from './block-scroll.effect';

export const SmoothScroll = ({
  transition,
  orientation = 'vertical',
  throttleDuration = 25,
  ...restProps
}: {
  children: ReactNode;
  transition?: Partial<{
    stiffness: number;
    damping: number;
    restDelta: number;
    mass?: number;
  }>;
} & ReactProps<CustomScrollInterface>) => {
  const scrollY = motionValue(0);

  const [el, setEl] = useState();
  useEffect(() => {
    setEl(document);
  }, []);

  const springY = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.1,
    ...(transition ?? {}),
  });

  useMotionValueEvent(springY, 'change', (value) => {
    console.log('springY', value);

    document.querySelector('html')?.scrollTo({ top: value });
    // // Supprime les micro-mouvements inutiles qui déclenchent des scrollTo coûteux
    // const rounded = Math.round(value * 1000) / 1000; // stabilité numérique
    // const last = lastAppliedYRef.current;
    // if (Math.abs(rounded - last) < 0.1) return; // ignorer les déplacements < 0.1px
    // lastAppliedYRef.current = rounded;
    // el.scrollTo({ top: rounded });
  });

  if (!el) return null;

  return (
    <BlockScroll
      el={el}
      onScroll={(scroll) => {
        if ('deltaY' in scroll && scroll.deltaY !== 0) {
          scrollY.set(window.scrollY + scroll.deltaY);
        }
      }}
    ></BlockScroll>
  );
};
