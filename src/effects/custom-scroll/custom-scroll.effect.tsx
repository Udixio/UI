import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { throttle } from 'lodash';
import { CustomScrollProps } from './custom-scroll.interface';
import { customScrollStyle } from './custom-scroll.style';

export const CustomScroll = ({
  children,
  orientation = 'vertical',
  scrollSize,
  onScroll,
  className,
  draggable = true,
}: CustomScrollProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === ref.current) {
          setWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

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

  const handleScrollThrottledRef = useRef<
    ((latestValue: number, scrollOrientation: 'x' | 'y') => void) | null
  >(null);

  if (!handleScrollThrottledRef.current) {
    handleScrollThrottledRef.current = throttle(
      (latestValue, scrollOrientation: 'x' | 'y') => {
        if (!containerSize.current || !contentScrollSize.current) return;
        if (onScroll) {
          if (orientation === 'horizontal' && scrollOrientation === 'x') {
            onScroll({
              scrollProgress: latestValue,
              scroll: latestValue * contentScrollSize.current.width,
              scrollTotal: contentScrollSize.current.width,
              scrollVisible: containerSize.current.width,
            });
          }
          if (orientation === 'vertical' && scrollOrientation === 'y') {
            onScroll({
              scrollProgress: latestValue,
              scroll: latestValue * contentScrollSize.current.height,
              scrollTotal: contentScrollSize.current.height,
              scrollVisible: containerSize.current.height,
            });
          }
        }
      },
      75
    );
  }

  const handleScroll = (latestValue: number, scrollOrientation: 'x' | 'y') => {
    if (handleScrollThrottledRef.current) {
      handleScrollThrottledRef.current(latestValue, scrollOrientation);
    }
  };

  useEffect(() => {
    if (width) handleScroll(scrollXProgress.get(), 'x');
  }, [width]);

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
  const [isDragging, setIsDragging] = useState(false);

  const styles = customScrollStyle({
    isDragging,
    children,
    className,
    onScroll,
    orientation,
    scrollSize,
    draggable,
  });

  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleDrag = (e: MouseEvent) => {
    if (!draggable) return;
    const container = ref.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft; // Déplace au fur et à mesure
    const walk = (x - startX) * 1.5; // Sensibilité du drag
    container.scrollLeft = scrollLeft - walk; // Mise à jour manuelle du défilement
  };
  const handleMouseDown = (e: any) => {
    console.log('mouseDown');
    const container = ref.current;
    if (!container) return;
    setIsDragging(true);
    setStartX(e.pageX - container.offsetLeft); // Détecte la position initiale
    setScrollLeft(container.scrollLeft); // Stocke la position de défilement actuelle
  };

  const handleMouseMove = (e: any) => {
    if (!isDragging) return;
    e.preventDefault();
    handleDrag(e);
  };

  const handleMouseUp = () => {
    console.log('mouseUp');
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    console.log('mouseLeave');
    setIsDragging(false);
  };
  const handleDragStart = (e: any) => {
    e.preventDefault();
  };

  useEffect(() => {
    console.log(isDragging);
  }, [isDragging]);

  return (
    <div
      className={styles.customScroll}
      ref={ref}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onDragStart={handleDragStart}
    >
      <div
        ref={contentRef}
        style={
          orientation === 'vertical'
            ? { height: containerSize?.current?.height ?? '100%' }
            : { width: containerSize?.current?.width ?? '100%' }
        }
        className={styles.track}
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
