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

  const lastAppliedYRef = useRef<number>(0);

  const scrollY = useTransform(
    scrollProgress,
    [0, 1],
    [0, scroll ? scroll.scrollTotal : 0],
  );

  const springY = useSpring(scrollY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.1,
    ...(transition ?? {}),
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
    // Supprime les micro-mouvements inutiles qui déclenchent des scrollTo coûteux
    const rounded = Math.round(value * 1000) / 1000; // stabilité numérique
    const last = lastAppliedYRef.current;
    if (Math.abs(rounded - last) < 0.1) return; // ignorer les déplacements < 0.1px
    lastAppliedYRef.current = rounded;
    ref.current?.scrollTo({ top: rounded });
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
