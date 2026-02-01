import { useEffect, useRef, ReactNode } from 'react';
import Lenis from 'lenis';

export type SmoothScrollProps = {
  /**
   * Duration of the scroll animation in seconds or as a CSS string (e.g., '1s', '500ms').
   * Default: 1.2
   */
  transition?: number | string;
  /**
   * Easing function for the scroll animation.
   * Default: easeOutQuint
   */
  easing?: (t: number) => number;
  /**
   * Scroll orientation.
   * Default: 'vertical'
   */
  orientation?: 'vertical' | 'horizontal';
  /**
   * Enable smooth scrolling on touch devices.
   * Default: false (native touch scrolling is usually preferred)
   */
  smoothTouch?: boolean;
  /**
   * Multiplier for touch scroll sensitivity.
   * Default: 2
   */
  touchMultiplier?: number;
  /**
   * Children elements (optional, component works at document level)
   */
  children?: ReactNode;
};

/**
 * SmoothScroll component using Lenis for smooth scrolling.
 * This component enables smooth scrolling at the document level.
 */
export const SmoothScroll = ({
  transition = 1.2,
  easing,
  orientation = 'vertical',
  smoothTouch = false,
  touchMultiplier = 2,
  children,
}: SmoothScrollProps) => {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Parse duration from string if needed (e.g., '1s' -> 1, '500ms' -> 0.5)
    let duration: number;
    if (typeof transition === 'string') {
      if (transition.endsWith('ms')) {
        duration = parseFloat(transition) / 1000;
      } else if (transition.endsWith('s')) {
        duration = parseFloat(transition);
      } else {
        duration = parseFloat(transition) || 1.2;
      }
    } else {
      duration = transition;
    }

    // Default easing: easeOutQuint
    const defaultEasing = (t: number) => 1 - Math.pow(1 - t, 5);

    // Initialize Lenis
    lenisRef.current = new Lenis({
      duration,
      easing: easing ?? defaultEasing,
      orientation,
      smoothWheel: true,
      touchMultiplier,
      syncTouch: smoothTouch,
    });

    // Animation frame loop
    const raf = (time: number) => {
      lenisRef.current?.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };

    rafRef.current = requestAnimationFrame(raf);

    // Cleanup
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [transition, easing, orientation, smoothTouch, touchMultiplier]);

  return children ? <>{children}</> : null;
};
