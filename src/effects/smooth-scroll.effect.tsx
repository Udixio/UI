import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { classNames } from '../utils';

export const SmoothScroll = ({
  children,
  orientation = 'vertical',
  maxSize,
}: {
  children: ReactNode;
  orientation?: 'vertical' | 'horizontal';
  maxSize?: number;
}) => {
  // scroll container

  const ref = useRef<HTMLDivElement>(null);

  const contentRef = useRef(null);

  const [contentScrollSize, setContentScrollSize] = useState({
    width: 0,
    height: 0,
  });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // observe when browser is resizing
  useLayoutEffect(() => {
    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect; // Dimensions de l'élément
        if (entry.target === ref.current) {
          // Mise à jour pour le premier élément
          setContainerSize({
            width,
            height,
          });
        } else if (entry.target === contentRef.current) {
          // Mise à jour pour le deuxième élément
          setContentScrollSize({
            width: maxSize ?? width,
            height: maxSize ?? height,
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
  }, [contentRef]);

  const { scrollYProgress, scrollY, scrollXProgress, scrollX } = useScroll({
    container: ref,
  });

  const transform = useTransform(
    orientation === 'vertical' ? scrollYProgress : scrollXProgress,
    [0, 1],
    orientation === 'vertical'
      ? [0, contentScrollSize.height - containerSize.height]
      : [0, -contentScrollSize.width - containerSize.width]
  );
  const physics = { damping: 15, mass: 0.27, stiffness: 55 }; // easing of smooth scroll
  const spring = useSpring(transform, physics); // apply easing to the negative scroll value

  return (
    <div
      className={classNames(' ', {
        'overflow-y-scroll max-h-full': orientation === 'vertical',
        'overflow-x-scroll flex max-w-full': orientation === 'horizontal',
      })}
      ref={ref}
    >
      <div
        style={
          orientation === 'vertical'
            ? { height: containerSize.height }
            : { width: containerSize.width }
        }
        className={classNames('overflow-hidden flex-none sticky', {
          'left-0': orientation === 'horizontal',
          'top-0': orientation === 'vertical',
        })}
      >
        <motion.div
          ref={contentRef}
          style={orientation == 'vertical' ? { y: spring } : { x: spring }}
        >
          {children}
        </motion.div>
      </div>

      {orientation === 'vertical' &&
        contentScrollSize.height > containerSize.height && (
          <motion.div style={{ height: contentScrollSize.height }} />
        )}

      {orientation === 'horizontal' &&
        contentScrollSize.width > containerSize.width && (
          <motion.div
            className={'flex-none'}
            style={{ width: contentScrollSize.width }}
          />
        )}
    </div>
  );
};
