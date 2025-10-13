import { ReactNode, useEffect, useRef, useState } from 'react';
import { useMotionValueEvent, useSpring } from 'motion/react';
import { CustomScrollInterface } from './custom-scroll';
import { ReactProps } from '../utils';
import { BlockScroll } from './block-scroll.effect';

export const SmoothScroll = ({
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
  // Target value (instant), driven by wheel/touch/keyboard or native scroll sync
  const [scrollY, setScrollY] = useState(0);

  const [el, setEl] = useState<HTMLHtmlElement>();

  const isScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastAppliedYRef = useRef(0);

  // Springed value that follows scrollY smoothly
  const springY = useSpring(0, {
    stiffness: transition?.stiffness ?? 300,
    damping: transition?.damping ?? 40,
    restDelta: transition?.restDelta ?? 0.1,
    mass: transition?.mass ?? 1,
  });

  useEffect(() => {
    setEl(document as unknown as HTMLHtmlElement);
    const y = document.documentElement.scrollTop;
    setScrollY(y);
    springY.set(y);
    lastAppliedYRef.current = y;
  }, []);

  // Sync native scroll (e.g., scrollbar, programmatic) back to target after a small delay
  useEffect(() => {
    const onScroll = () => {
      if (isScrolling.current) return;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollY(document.documentElement.scrollTop);
        isScrolling.current = false;
      }, 500);
    };

    el?.addEventListener('scroll', onScroll as unknown as EventListener);
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      el?.removeEventListener('scroll', onScroll as unknown as EventListener);
    };
  }, [el]);

  // Drive the spring when target changes
  useEffect(() => {
    springY.set(scrollY);
  }, [scrollY]);

  useMotionValueEvent(springY, 'change', (value) => {
    const html = document.documentElement;
    // Avoid micro-movements causing extra layout work
    const rounded = Math.round(value * 1000) / 1000;
    const last = lastAppliedYRef.current;
    if (Math.abs(rounded - last) < 0.1) return;
    lastAppliedYRef.current = rounded;

    if (isScrolling.current) {
      console.log('scrolY', rounded);
      html.scrollTo({ top: rounded });
    }
  });

  if (!el) return null;

  return (
    <BlockScroll
      touch={false}
      el={el as unknown as HTMLElement}
      onScroll={(scroll) => {
        if (
          'deltaY' in scroll &&
          scroll.deltaY !== 0 &&
          el &&
          scrollY !== null
        ) {
          let y = scrollY + scroll.deltaY;
          const html = el.querySelector('html');
          if (html) {
            y = Math.min(y, html.scrollHeight - html.clientHeight);
          }
          y = Math.max(y, 0);
          setScrollY(y);

          isScrolling.current = true;
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
          scrollTimeoutRef.current = setTimeout(() => {
            isScrolling.current = false;
          }, 300);
        }
      }}
    ></BlockScroll>
  );
};
