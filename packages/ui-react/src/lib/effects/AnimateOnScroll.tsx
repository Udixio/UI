import React, { CSSProperties, ReactNode, useEffect, useMemo } from 'react';
import { initScrollAnimations } from './animations';

/**
 * AnimateOnScroll
 *
 * Acts as a trigger-only wrapper: animations are defined via Tailwind classes on children.
 * If CSS Scroll-Driven Animations are unsupported, a JS fallback will progressively animate
 * all descendant elements that have known animate-* classes.
 */

export type AnimateOnScrollProps = {
  children?: ReactNode;
  once?: boolean; // if true in JS fallback, animate only first time per element
};

function supportsScrollTimeline(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // @ts-ignore - CSS may not exist in TS lib
    if (window.CSS && typeof window.CSS.supports === 'function') {
      // @ts-ignore
      return (
        CSS.supports('animation-timeline: view()') ||
        CSS.supports('animation-timeline: scroll()') ||
        // some older implementations used view-timeline-name
        CSS.supports('view-timeline-name: --a')
      );
    }
  } catch {}
  return false;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const AnimateOnScroll = ({ children, once = true }: AnimateOnScrollProps) => {
  const reduced = useMemo(prefersReducedMotion, []);
  const cssSupported = useMemo(() => supportsScrollTimeline(), []);

  useEffect(() => {
    if (!cssSupported && !reduced) {
      // Initialize global JS fallback to animate elements with .aos-view and animate-* classes
      const stop = initScrollAnimations({ once });
      return () => {
        if (typeof stop === 'function') stop();
      };
    }
    return;
  }, [cssSupported, reduced, once]);

  // Always return only children; no extra DOM
  return <>{children}</>;
};
