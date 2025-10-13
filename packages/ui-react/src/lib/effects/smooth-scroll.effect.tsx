import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  motion,
  motionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from 'motion/react';
import { CustomScroll, CustomScrollInterface } from './custom-scroll';
import { classNames, ReactProps } from '../utils';

export const SmoothScroll = ({
  children,
  transition = '.5s',
  orientation = 'vertical',
  throttleDuration = 25,
  ...restProps
}: {
  children: ReactNode;
  transition?: string;
} & ReactProps<CustomScrollInterface>) => {
  const [scroll, setScroll] = useState<{
    scrollProgress: number;
    scrollTotal: number;
    scrollVisible: number;
    scroll: number;
  } | null>(null);

  const scrollProgress = motionValue(scroll?.scrollProgress ?? 0);

  const ref = useRef<HTMLDivElement | null>(null);
  const refScrollable = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const scrollY = useTransform(
    scrollProgress,
    [0, 1],
    [0, scroll ? scroll.scrollTotal : 0],
  );

  const springY = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

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

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.target.scrollHeight || entry.contentRect.height;
        setDimensions({
          width: entry.contentRect.width,
          height: height,
        });
      }
    });

    if (refScrollable.current) {
      observer.observe(refScrollable.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useMotionValueEvent(springY, 'change', (value) => {
    ref.current.scrollTo({ top: value });

    console.log('grfgrf', value); // Affiche également la valeur si nécessaire
  });

  return (
    <CustomScroll
      scrollSize={dimensions?.height}
      onScroll={handleScroll}
      throttleDuration={throttleDuration}
      className={classNames('h-screen')}
      {...restProps}
    >
      <motion.div
        ref={ref}
        style={{ transform: `translateY(-${springY}px)` }}
        className={classNames('h-screen overflow-y-hidden', {})}
      >
        <div ref={refScrollable}>{children}</div>
      </motion.div>
    </CustomScroll>
  );
};
