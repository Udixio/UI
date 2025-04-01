import { ReactNode, useRef, useState } from 'react';
import {
  motion,
  motionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import { CustomScroll } from './custom-scroll/custom-scroll.effect';
import { classNames } from '../utils';
import { CustomScrollProps } from './custom-scroll';

export const SmoothScroll = ({
  children,
  transition = '.5s',
  orientation = 'vertical',
  throttleDuration = 25,
  ...restProps
}: {
  children: ReactNode;
  transition?: string;
} & CustomScrollProps) => {
  const [scroll, setScroll] = useState<{
    scrollProgress: number;
    scrollTotal: number;
    scrollVisible: number;
    scroll: number;
  } | null>(null);

  const scrollProgress = motionValue(scroll?.scrollProgress ?? 0);

  const transform = useTransform(
    scrollProgress,
    [0, 1],
    [0, 1 - (scroll?.scrollVisible ?? 0) / (scroll?.scrollTotal ?? 0)]
  );

  const percentTransform = useTransform(
    transform,
    (value) => `${-value * 100}%`
  );

  const handleScroll = (args: {
    scrollProgress: number;
    scrollTotal: number;
    scrollVisible: number;
    scroll: number;
  }) => {
    scrollProgress.set(args.scrollProgress);
    if (args.scrollTotal > 0) {
      setScroll(args);
    }
  };
  const lastChangeTimeRef = useRef<number | null>(null);
  useMotionValueEvent(percentTransform, 'change', (value) => {
    // Récupérer l'heure actuelle
    const now = performance.now();

    // Si une heure précédente existe, calculer le delta
    if (lastChangeTimeRef.current !== null) {
      const deltaTime = now - lastChangeTimeRef.current;
      console.log(`Delta temps : ${deltaTime} ms`);
    }

    // Mettre à jour l'heure du dernier changement
    lastChangeTimeRef.current = now;

    console.log(value); // Affiche également la valeur si nécessaire
  });

  return (
    <CustomScroll
      onScroll={handleScroll}
      throttleDuration={throttleDuration}
      {...restProps}
    >
      <motion.div
        className={classNames('transition-transform  ease-out', {
          'w-fit h-full': orientation === 'horizontal',
          'h-fit w-full': orientation === 'vertical',
        })}
        style={{
          transitionDuration: transition,
          ...(orientation == 'vertical'
            ? { y: percentTransform }
            : { x: percentTransform }),
        }}
      >
        {children}
      </motion.div>
    </CustomScroll>
  );
};
