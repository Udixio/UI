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
  const contentRef = useRef<HTMLDivElement>(null);

  const contentScrollSize = useRef<{
    height: number;
    width: number;
  } | null>(null);
  const containerSize = useRef<{
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
    if (!containerSize.current || !contentScrollSize.current) return;

    orientation === 'horizontal' &&
      scrollOrientation === 'x' &&
      onScroll &&
      onScroll({
        scrollProgress: latestValue,
        scroll: latestValue * contentScrollSize.current.width,
        scrollTotal: contentScrollSize.current.width,
        scrollVisible: containerSize.current.width,
      });
    orientation === 'vertical' &&
      scrollOrientation === 'y' &&
      onScroll &&
      onScroll({
        scrollProgress: latestValue,
        scroll: latestValue * contentScrollSize.current.height,
        scrollTotal: contentScrollSize.current.height,
        scrollVisible: containerSize.current.height,
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
    if (!containerSize.current || !contentScrollSize.current || !onScroll)
      return;

    onScroll({
      scrollProgress: 0,
      scroll: 0,
      scrollTotal:
        orientation == 'vertical'
          ? contentScrollSize.current.height
          : contentScrollSize.current.width,
      scrollVisible:
        orientation == 'vertical'
          ? containerSize.current.height
          : containerSize.current.width,
    });
    setIsInitialized(true);
  }, [containerSize, contentScrollSize, onScroll]);

  contentScrollSize.current = getContentScrollSize();
  containerSize.current = getContainerSize();

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
            ? { height: containerSize?.current?.height ?? '100%' }
            : { width: containerSize?.current?.width ?? '100%' }
        }
        className={classNames('overflow-hidden flex-none sticky', {
          'left-0 h-full': orientation === 'horizontal',
          'top-0 w-full': orientation === 'vertical',
        })}
      >
        {children}
      </div>

      {containerSize.current && contentScrollSize.current && (
        <>
          {orientation === 'vertical' &&
            contentScrollSize.current.height > containerSize.current.height && (
              <motion.div
                style={{
                  height:
                    contentScrollSize.current.height -
                    containerSize.current.height,
                }}
              />
            )}

          {orientation === 'horizontal' &&
            contentScrollSize.current.width > containerSize.current.width && (
              <motion.div
                className={'flex-none'}
                style={{
                  width:
                    contentScrollSize.current.width -
                    containerSize.current.width,
                }}
              />
            )}
        </>
      )}
    </div>
  );
};
