import { ReactNode, useEffect, useRef, useState } from 'react';
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
  const [scrollY, setScrollY] = useState(0);

  const [el, setEl] = useState<HTMLHtmlElement>();

  const isScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    setEl(document);
    setScrollY(document.documentElement.scrollTop);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (isScrolling.current) return;
      console.log(
        'fix scroll',
        isScrolling.current,
        document.documentElement.scrollTop,
      );
      scrollTimeoutRef.current = setTimeout(() => {
        setScrollY(document.documentElement.scrollTop);
      }, 500);
    };

    el?.addEventListener('scroll', onScroll);
    return () => {
      el?.removeEventListener('scroll', onScroll);
    };
  }, [el]);

  useEffect(() => {
    console.log('springY', scrollY);

    const html = document.querySelector('html');
    html.scrollTo({ top: scrollY });

    // // Supprime les micro-mouvements inutiles qui déclenchent des scrollTo coûteux
    // const rounded = Math.round(value * 1000) / 1000; // stabilité numérique
    // const last = lastAppliedYRef.current;
    // if (Math.abs(rounded - last) < 0.1) return; // ignorer les déplacements < 0.1px
    // lastAppliedYRef.current = rounded;
    // el.scrollTo({ top: rounded });
  }, [scrollY]);

  if (!el) return null;

  return (
    <BlockScroll
      touch={false}
      el={el}
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
          }, 500);
        }
      }}
    ></BlockScroll>
  );
};
