import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { classNames } from '../utils';
import { throttle } from 'lodash';

export const CustomScroll = ({
  children,
  orientation = 'vertical',
  scrollSize,
  onScroll,
}: {
  children: ReactNode;
  orientation?: 'vertical' | 'horizontal';
  scrollSize?: number;
  onScroll?: (args: {
    scroll: number;
    scrollProgress: number;
    scrollTotal: number;
    scrollVisible: number;
  }) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const contentRef = useRef(null);

  const [contentScrollSize, setContentScrollSize] = useState({
    width: 0,
    height: 0,
  });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (entry.target === ref.current) {
          setContainerSize({
            width,
            height,
          });
        } else if (entry.target === contentRef.current) {
          const el = contentRef.current as HTMLDivElement;
          setContentScrollSize({
            width: scrollSize ?? el.scrollWidth,
            height: scrollSize ?? el.scrollHeight,
          });
        }
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    if (!ref.current || !contentRef.current) {
      throw new Error('ref or contentRef is not properly initialized.');
    }
    ref && resizeObserver.observe(ref.current);
    contentRef && resizeObserver.observe(contentRef.current);

    return () => resizeObserver.disconnect();
  }, [contentRef, orientation]);

  const { scrollYProgress, scrollXProgress } = useScroll({
    container: ref,
  });

  const handleScroll = throttle((latestValue) => {
    console.log('scroll', latestValue);
    orientation === 'horizontal' &&
      onScroll &&
      onScroll({
        scrollProgress: latestValue,
        scroll: latestValue * contentScrollSize.width,
        scrollTotal: contentScrollSize.width,
        scrollVisible: containerSize.width,
      });
    orientation === 'vertical' &&
      onScroll &&
      onScroll({
        scrollProgress: latestValue,
        scroll: latestValue * contentScrollSize.height,
        scrollTotal: contentScrollSize.height,
        scrollVisible: containerSize.height,
      });
  }, 50);

  useMotionValueEvent(scrollXProgress, 'change', handleScroll);
  useMotionValueEvent(scrollYProgress, 'change', handleScroll);

  return (
    <div
      className={classNames('h-full w-full', {
        'overflow-y-scroll': orientation === 'vertical',
        'overflow-x-scroll ': orientation === 'horizontal',
      })}
      ref={ref}
    >
      <div
        ref={contentRef}
        style={
          orientation === 'vertical'
            ? { height: containerSize.height }
            : { width: containerSize.width }
        }
        className={classNames('overflow-hidden flex-none sticky', {
          'left-0 h-full': orientation === 'horizontal',
          'top-0 w-full': orientation === 'vertical',
        })}
      >
        {children}
      </div>

      {orientation === 'vertical' &&
        contentScrollSize.height > containerSize.height && (
          <motion.div
            style={{ height: contentScrollSize.height - containerSize.height }}
          />
        )}

      {orientation === 'horizontal' &&
        contentScrollSize.width > containerSize.width && (
          <motion.div
            className={'flex-none'}
            style={{ width: contentScrollSize.width - containerSize.width }}
          />
        )}
    </div>
  );
};
