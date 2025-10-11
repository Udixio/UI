import React, { CSSProperties, ReactNode, useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'motion/react';

export type AnimateOnScrollType =
  | 'fade'
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'zoom-out';

export type AnimateOnScrollProps = {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children?: ReactNode;
  animate?: AnimateOnScrollType;
  duration?: number; // ms (not used directly in JS path but kept for API parity)
  delay?: number; // ms (not used directly in JS path but kept for API parity)
  easing?: string; // CSS easing function (not used directly in JS path)
  range?: string; // CSS animation-range, e.g. 'entry 0% cover 30%'
  once?: boolean; // if true in JS fallback, animate only first time fully visible
  threshold?: number; // kept for API parity
  style?: CSSProperties;
};

// JS fallback component to drive animation based on scroll progress when CSS scroll-timeline isn't supported
const AnimateOnScrollFallback = ({
  as = 'div',
  className,
  children,
  animate = 'fade-up',
  range = 'entry 0% cover 30%',
  once = true,
  style,
}: AnimateOnScrollProps) => {
  const Tag = as as any;
  const ref = useRef<HTMLElement | null>(null);

  // Base style: will-change hints to optimize painting
  const computedStyle: CSSProperties = useMemo(() => {
    const s: CSSProperties = { ...style };
    s.willChange = 'opacity, transform';
    return s;
  }, [style]);

  // Viewport scroll value
  const { scrollY } = useScroll();
  // Target-based progress as a fallback when we can't parse the cover-range
  const { scrollYProgress: targetProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const progressMV = useMotionValue(0);
  const lastProgressRef = useRef(0);

  const coverRange = useMemo(() => {
    if (typeof range !== 'string') return null;
    const m = range.match(/entry\s+(\d+)%\s+cover\s+(\d+)%/i);
    if (!m) return null;
    const startPct = parseFloat(m[1]);
    const coverPct = parseFloat(m[2]);
    if (isNaN(startPct) || isNaN(coverPct)) return null;
    return { startPct, coverPct };
  }, [range]);

  const updateFromDOM = () => {
    if (!ref.current) return;
    const el = ref.current as HTMLElement;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    if (rect.height <= 0 || vh <= 0) return;
    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    const visibleClamped = Math.max(0, Math.min(visible, rect.height));
    const ratio = visibleClamped / rect.height; // 0..1 of element covered in viewport

    const s = (coverRange?.startPct ?? 0) / 100;
    const e = Math.max(s + 0.0001, coverRange ? coverRange.coverPct / 100 : 0.3);
    let p = (ratio - s) / (e - s);
    p = Math.max(0, Math.min(1, p));

    if (once && lastProgressRef.current >= 1) {
      p = 1;
    }

    lastProgressRef.current = p;
    progressMV.set(p);
  };

  useEffect(() => {
    if (!coverRange) return;
    updateFromDOM();
    const onResize = () => updateFromDOM();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [coverRange]);

  useMotionValueEvent(scrollY, 'change', () => {
    if (!coverRange) return;
    updateFromDOM();
  });

  // Fallback when range cannot be parsed: use framer's target progress
  useMotionValueEvent(targetProgress, 'change', (v) => {
    if (coverRange) return; // handled above
    lastProgressRef.current = v;
    progressMV.set(v);
  });

  let fromOpacity = 0;
  const toOpacity = 1;
  let fromX = 0;
  const toX = 0;
  let fromY = 0;
  const toY = 0;
  let fromScale = 1;
  const toScale = 1;

  switch (animate) {
    case 'fade':
      fromOpacity = 0;
      break;
    case 'fade-up':
      fromOpacity = 0;
      fromY = 100;
      break;
    case 'fade-down':
      fromOpacity = 0;
      fromY = -100;
      break;
    case 'fade-left':
      fromOpacity = 0;
      fromX = 100;
      break;
    case 'fade-right':
      fromOpacity = 0;
      fromX = -100;
      break;
    case 'zoom-in':
      fromOpacity = 0;
      fromScale = 0.95;
      break;
    case 'zoom-out':
      fromOpacity = 0.999;
      fromScale = 1.05;
      break;
    default:
      break;
  }

  const opacityMV = useTransform(progressMV, [0, 1], [fromOpacity, toOpacity]);
  const xMV = useTransform(progressMV, [0, 1], [fromX, toX]);
  const yMV = useTransform(progressMV, [0, 1], [fromY, toY]);
  const scaleMV = useTransform(progressMV, [0, 1], [fromScale, toScale]);

  const MotionTag: any = (motion as any)[as] ?? motion.div;
  return (
    <MotionTag
      ref={ref as any}
      className={className}
      style={{
        ...computedStyle,
        opacity: opacityMV,
        x: xMV,
        y: yMV,
        scale: scaleMV,
      }}
    >
      {children}
    </MotionTag>
  );
};

export default AnimateOnScrollFallback;
