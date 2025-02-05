import { ReactNode, useState } from 'react';
import { motion, motionValue, useSpring, useTransform } from 'framer-motion';
import { CustomScroll } from './custom-scroll.effect';
import { classNames } from '../utils';

export const SmoothScroll = ({
  children,
  orientation = 'vertical',
  physics = { damping: 15, mass: 0.27, stiffness: 55 },
}: {
  children: ReactNode;
  orientation?: 'vertical' | 'horizontal';
  physics?: { damping: number; mass: number; stiffness: number };
}) => {
  const scrollProgress = motionValue(0);

  const [dynamicRange, setDynamicRange] = useState(0);

  const transform = useTransform(scrollProgress, [0, 1], [0, dynamicRange]);

  const spring = useSpring(transform, physics);
  const percentTransform = useTransform(spring, (value) => `${-value * 100}%`);

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
        className={classNames({
          'w-fit': orientation === 'horizontal',
          'h-fit': orientation === 'vertical',
        })}
        style={
          orientation == 'vertical'
            ? { y: percentTransform }
            : { x: percentTransform }
        }
      >
        {children}
      </motion.div>
    </CustomScroll>
  );
};
