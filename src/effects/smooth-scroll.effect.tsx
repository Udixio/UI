import { ReactNode, useState } from 'react';
import { motion, motionValue, useTransform } from 'framer-motion';
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
  const scrollProgress = motionValue(0);

  const [dynamicRange, setDynamicRange] = useState(0);

  const transform = useTransform(scrollProgress, [0, 1], [0, dynamicRange]);

  const percentTransform = useTransform(
    transform,
    (value) => `${-value * 100}%`
  );

  return (
    <CustomScroll
      orientation={orientation}
      onScroll={(args) => {
        scrollProgress.set(args.scrollProgress);
        if (args.scrollTotal > 0) {
          setDynamicRange(1 - args.scrollVisible / args.scrollTotal);
        }
      }}
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
