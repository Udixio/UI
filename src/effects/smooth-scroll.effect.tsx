import {
  ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';

export const SmoothScroll = ({ children }: { children: ReactNode }) => {
  // scroll container

  const ref = useRef<HTMLDivElement>(null);

  const contentRef = useRef(null);

  // page scrollable height based on content length
  const [contentScrollSize, setContentScrollSize] = useState({
    width: 0,
    height: 0,
  });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // update scrollable height when browser is resizing
  const resizeScrollHeight = useCallback((entries) => {
    for (let entry of entries) {
      setContentScrollSize(entry.contentRect.height);
    }
  }, []);

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
            width,
            height,
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
  }, [contentRef, resizeScrollHeight]);

  const { scrollYProgress, scrollY } = useScroll({ container: ref }); // measures how many pixels user has scrolled vertically
  // as scrollY changes between 0px and the scrollable height, create a negative scroll value...
  // ... based on current scroll position to translateY the document in a natural way

  useMotionValueEvent(scrollYProgress, 'change', (latestValue) => {
    console.log(latestValue, scrollY.get(), contentScrollSize);
  });

  const transform = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -contentScrollSize.height + containerSize.height]
  );
  const before = useTransform(scrollYProgress, [0, 1], [0, contentScrollSize]);
  const after = useTransform(scrollYProgress, [0, 1], [contentScrollSize, 0]);
  const physics = { damping: 15, mass: 0.27, stiffness: 55 }; // easing of smooth scroll
  const spring = useSpring(transform, physics); // apply easing to the negative scroll value

  return (
    <div className={'max-h-full overflow-y-scroll'} ref={ref}>
      {/*<motion.div style={{ height: before }} />*/}
      <div
        style={{ height: ref.current?.clientHeight ?? '100%' }}
        className={'overflow-hidden scroll-container top-0 sticky'}
      >
        <motion.div
          ref={contentRef}
          style={{ y: spring }} // translateY of scroll container using negative scroll value
        >
          {/*{children}*/}
          <div
            style={{ height: '200px', width: '800px' }}
            className={'bg-primary'}
          />{' '}
          <div
            style={{ height: '200px', width: '800px' }}
            className={'bg-secondary'}
          />{' '}
          <div
            style={{ height: '200px', width: '800px' }}
            className={'bg-tertiary'}
          />{' '}
          <div
            style={{ height: '200px', width: '800px' }}
            className={'bg-primary'}
          />{' '}
          <div
            style={{ height: '200px', width: '800px' }}
            className={'bg-secondary'}
          />{' '}
        </motion.div>
      </div>

      {/* blank div that has a dynamic height based on the content's inherent height */}
      {/* this is neccessary to allow the scroll container to scroll... */}
      {/* ... using the browser's native scroll bar */}
      {contentScrollSize.height > containerSize.height && (
        <motion.div style={{ height: contentScrollSize.height }} />
      )}
    </div>
  );
};
