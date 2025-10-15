import { useEffect, useRef, useState } from 'react';
import { CustomScrollInterface } from './custom-scroll';
import { ReactProps } from '../utils';
import { BlockScroll } from './block-scroll.effect';
import { animate, AnimationPlaybackControls } from 'motion';

export const SmoothScroll = ({
  transition,
  orientation = 'vertical',
  throttleDuration = 25,
}: {
  transition?: {
    duration?: number;
  };
} & ReactProps<CustomScrollInterface>) => {
  // Target value (instant), driven by wheel/touch/keyboard or native scroll sync
  const [scrollY, setScrollY] = useState(0);

  const [el, setEl] = useState<HTMLHtmlElement>();

  const isScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const lastAppliedYRef = useRef(0);

  useEffect(() => {
    setEl(document as unknown as HTMLHtmlElement);
    const y = document.documentElement.scrollTop;
    setScrollY(y);
    lastAppliedYRef.current = y;
  }, []);

  // Sync native scroll (e.g., scrollbar, programmatic) back to target after a small delay
  useEffect(() => {
    const onScroll = () => {
      if (isScrolling.current) return;
      setScrollY(document.documentElement.scrollTop);
    };

    el?.addEventListener('scroll', onScroll as unknown as EventListener);
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      el?.removeEventListener('scroll', onScroll as unknown as EventListener);
    };
  }, [el]);

  // Drive the spring when target changes
  const currentY = useRef<number | null>();
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  useEffect(() => {
    const y = scrollY;

    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    if (!isScrolling.current) {
      currentY.current = y;
      return;
    }
    animationRef.current = animate(currentY.current ?? y, y, {
      duration: transition?.duration ?? 0.5,
      ease: 'circOut',

      onUpdate: (value) => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        currentY.current = value;

        const html = document.documentElement;
        // Avoid micro-movements causing extra layout work
        const rounded = Math.round(value * 1000) / 1000;
        const last = lastAppliedYRef.current;
        if (Math.abs(rounded - last) < 0.1) return;
        lastAppliedYRef.current = rounded;

        if (isScrolling.current) {
          html.scrollTo({ top: rounded });
        }
      },
      onComplete: () => {
        scrollTimeoutRef.current = setTimeout(() => {
          isScrolling.current = false;
        }, 300);
        animationRef.current = null;
      },
    });
    return () => {
      // Safety: stop if effect re-runs quickly
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [scrollY]);

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
        }
      }}
    ></BlockScroll>
  );
};
