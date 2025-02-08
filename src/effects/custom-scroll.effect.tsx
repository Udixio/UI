import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);

  const [contentScrollSize, setContentScrollSize] = useState<{
    height: number;
    width: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState<{
    height: number;
    width: number;
  } | null>(null);

  const getContentScrollSize = () => {
    const el = contentRef.current;
    if (!el) {
      return null;
    }
    return {
      width: scrollSize ?? el.scrollWidth,
      height: scrollSize ?? el.scrollHeight,
    };
  };
  const getContainerSize = (): { width: number; height: number } | null => {
    const el = ref.current;
    if (!el) {
      return null;
    }
    return {
      width: el.clientWidth,
      height: el.scrollHeight,
    };
  };

  const { scrollYProgress, scrollXProgress } = useScroll({
    container: ref,
  });

  const handleScroll = throttle((latestValue, scrollOrientation: 'x' | 'y') => {
    if (!containerSize || !contentScrollSize) return;

    orientation === 'horizontal' &&
      scrollOrientation === 'x' &&
      onScroll &&
      onScroll({
        scrollProgress: latestValue,
        scroll: latestValue * contentScrollSize.width,
        scrollTotal: contentScrollSize.width,
        scrollVisible: containerSize.width,
      });
    orientation === 'vertical' &&
      scrollOrientation === 'y' &&
      onScroll &&
      onScroll({
        scrollProgress: latestValue,
        scroll: latestValue * contentScrollSize.height,
        scrollTotal: contentScrollSize.height,
        scrollVisible: containerSize.height,
      });
  }, 50);

  useMotionValueEvent(scrollXProgress, 'change', (latestValue) => {
    handleScroll(latestValue, 'x');
  });
  useMotionValueEvent(scrollYProgress, 'change', (latestValue) => {
    handleScroll(latestValue, 'y');
  });

  const [isInitialized, setIsInitialized] = useState(false);
  useLayoutEffect(() => {
    if (isInitialized) return;
    if (!containerSize || !contentScrollSize || !onScroll) return;
    if (contentScrollSize.height == 0 || contentScrollSize.width == 0) return;

    onScroll({
      scrollProgress: 0,
      scroll: 0,
      scrollTotal: contentScrollSize.height,
      scrollVisible: containerSize.height,
    });
    setIsInitialized(true);
  }, [containerSize, contentScrollSize, onScroll]);

  useLayoutEffect(() => {
    setContentScrollSize(getContentScrollSize());
    setContainerSize(getContainerSize());
  }, [children]);

  useEffect(() => {}, [contentScrollSize, containerSize]);

  return (
    <div
      className={classNames('flex h-full w-full', {
        'overflow-y-scroll flex-col': orientation === 'vertical',
        'overflow-x-scroll  flex-row': orientation === 'horizontal',
      })}
      ref={ref}
    >
      <div
        ref={contentRef}
        style={
          orientation === 'vertical'
            ? { height: containerSize?.height ?? '100%' }
            : { width: containerSize?.width ?? '100%' }
        }
        className={classNames('overflow-hidden flex-none sticky', {
          'left-0 h-full': orientation === 'horizontal',
          'top-0 w-full': orientation === 'vertical',
        })}
      >
        {children}
      </div>

      {containerSize && contentScrollSize && (
        <>
          {orientation === 'vertical' &&
            contentScrollSize.height > containerSize.height && (
              <motion.div
                style={{
                  height: contentScrollSize.height - containerSize.height,
                }}
              />
            )}

          {orientation === 'horizontal' &&
            contentScrollSize.width > containerSize.width && (
              <motion.div
                className={'flex-none'}
                style={{ width: contentScrollSize.width - containerSize.width }}
              />
            )}
        </>
      )}
    </div>
  );
};
