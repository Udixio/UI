import { ReactNode, useState } from 'react';
import {
  motion,
  motionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import { CustomScroll } from './custom-scroll/custom-scroll.effect';
import { classNames } from '../utils';

export const SmoothScroll = ({
  children,
  orientation = 'vertical',
  transition = '.5s',
}: {
  children: ReactNode;
  orientation?: 'vertical' | 'horizontal';
  transition?: string;
}) => {
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

  useMotionValueEvent(scrollProgress, 'change', (latestValue) => {
    console.log('dd', scrollProgress);
  });
  return (
    <CustomScroll orientation={orientation} onScroll={handleScroll}>
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
