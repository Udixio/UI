import React, { ReactNode, useEffect, useMemo, useRef } from 'react';

/**
 * AnimateOnScroll
 *
 * Manages triggers for CSS Scroll-Driven animations (only).
 * - In supporting browsers: hydrates elements to ensure proper timeline, offsets, and play state.
 * - In non-supporting browsers: dynamically imports a JS fallback that simulates the behavior.
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

function isScrollDrivenCandidate(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const cls = el.classList;
  const hasAnimation = cls.contains('animate-in') || cls.contains('animate-out');
  if (!hasAnimation) return false;
  // Explicit opt-in via class or data attribute
  return (
    cls.contains('udx-view') ||
    cls.contains('udx-view-x') ||
    cls.contains('udx-view-y') ||
    cls.contains('udx-view-inline') ||
    cls.contains('udx-view-block') ||
    el.hasAttribute('data-udx-view')
  );
}

function hydrateElement(el: HTMLElement) {
  if (!isScrollDrivenCandidate(el)) return;

  // Map data-udx-view to correct axis class if provided
  if (el.hasAttribute('data-udx-view')) {
    const raw = (el.getAttribute('data-udx-view') || '').trim().toLowerCase();
    const axis = raw === 'x' || raw === 'inline' ? 'inline' : raw === 'y' || raw === 'block' ? 'block' : 'auto';
    const hasAny = el.classList.contains('udx-view') || el.classList.contains('udx-view-inline') || el.classList.contains('udx-view-block') || el.classList.contains('udx-view-x') || el.classList.contains('udx-view-y');
    if (!hasAny) {
      if (axis === 'inline') el.classList.add('udx-view-inline');
      else if (axis === 'block') el.classList.add('udx-view-block');
      else el.classList.add('udx-view');
    }
  }

  // Offsets via data-udx-start / data-udx-end (accepts tokens like "entry 20%", "cover 50%", etc.)
  const start = el.getAttribute('data-udx-start');
  if (start) el.style.setProperty('--udx-range-start', start);
  const end = el.getAttribute('data-udx-end');
  if (end) el.style.setProperty('--udx-range-end', end);

  // Ensure play state is running unless explicitly paused
  const explicitlyPaused = el.hasAttribute('data-udx-paused') || el.classList.contains('udx-paused');
  const alreadyRunning = el.hasAttribute('data-udx-run') || el.classList.contains('udx-run');
  if (!explicitlyPaused && !alreadyRunning) {
    el.setAttribute('data-udx-run', '');
  }
}

function queryCandidates(root: ParentNode = document): HTMLElement[] {
  const selector = [
    '.udx-view',
    '.udx-view-x',
    '.udx-view-y',
    '.udx-view-inline',
    '.udx-view-block',
    '[data-udx-view]'
  ]
    .map((s) => `${s}.animate-in, ${s}.animate-out`)
    .join(', ');
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

export const AnimateOnScroll = ({ children, once = true }: AnimateOnScrollProps) => {
  const reduced = useMemo(prefersReducedMotion, []);
  const cssSupported = useMemo(() => supportsScrollTimeline(), []);
  const moRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (reduced) return; // respect reduced motion

    if (cssSupported) {
      let rafId: number | null = null;
      const schedule = () => {
        if (rafId != null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const els = queryCandidates();
          for (const el of els) hydrateElement(el);
        });
      };

      // Initial hydration
      schedule();

      // Observe DOM changes to re-hydrate
      const mo = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === 'attributes') {
            const t = m.target;
            if (t instanceof HTMLElement) hydrateElement(t as HTMLElement);
          } else if (m.type === 'childList') {
            schedule();
          }
        }
      });
      mo.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class', 'data-udx-view', 'data-udx-start', 'data-udx-end', 'data-udx-paused', 'data-udx-run'],
      });
      moRef.current = mo;

      return () => {
        if (rafId != null) cancelAnimationFrame(rafId);
        mo.disconnect();
        moRef.current = null;
      };
    } else {
      // No CSS support: dynamically import the fallback and init it
      let stop: void | (() => void);
      import('./scrollDriven').then((m) => {
        stop = m.initScrollViewFallback({ once });
      });
      return () => {
        if (typeof stop === 'function') (stop as () => void)();
      };
    }
  }, [cssSupported, reduced, once]);

  // Always return only children; no extra DOM
  return <>{children}</>;
};
