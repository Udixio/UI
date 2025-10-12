import React, { ReactNode, useEffect, useMemo, useRef } from 'react';

/**
 * AnimateOnScroll
 *
 * Manages triggers for animations:
 * - ScrollDriven animations: use native CSS if supported; otherwise import JS fallback per element set.
 * - Other entry/exit animations: handled via IntersectionObserver in JS.
 */

export type AnimateOnScrollProps = {
  children?: ReactNode;
  once?: boolean; // if true in JS modes, animate only first time per element
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
  const hasAnimation =
    cls.contains('animate-in') || cls.contains('animate-out');
  if (!hasAnimation) return false;
  // Explicit opt-in via class or data attribute for ScrollDriven
  return (
    cls.contains('udx-view') ||
    cls.contains('udx-view-x') ||
    cls.contains('udx-view-y') ||
    cls.contains('udx-view-inline') ||
    cls.contains('udx-view-block') ||
    el.hasAttribute('data-udx-view')
  );
}

function isJsObserverCandidate(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const cls = el.classList;
  const hasAnimation =
    cls.contains('animate-in') || cls.contains('animate-out');
  if (!hasAnimation) return false;
  // Not scroll-driven
  return !isScrollDrivenCandidate(el);
}

function hydrateElement(el: HTMLElement) {
  if (!isScrollDrivenCandidate(el)) return;

  // Map data-udx-view to correct axis class if provided
  if (el.hasAttribute('data-udx-view')) {
    const raw = (el.getAttribute('data-udx-view') || '').trim().toLowerCase();
    const axis =
      raw === 'x' || raw === 'inline'
        ? 'inline'
        : raw === 'y' || raw === 'block'
          ? 'block'
          : 'auto';
    const hasAny =
      el.classList.contains('udx-view') ||
      el.classList.contains('udx-view-inline') ||
      el.classList.contains('udx-view-block') ||
      el.classList.contains('udx-view-x') ||
      el.classList.contains('udx-view-y');
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
  const explicitlyPaused =
    el.hasAttribute('data-udx-paused') || el.classList.contains('udx-paused');
  const alreadyRunning =
    el.hasAttribute('data-udx-run') || el.classList.contains('udx-run');
  if (!explicitlyPaused && !alreadyRunning) {
    el.setAttribute('data-udx-run', '');
  }
}

const scrollDrivenSelectorParts = [
  '.udx-view',
  '.udx-view-x',
  '.udx-view-y',
  '.udx-view-inline',
  '.udx-view-block',
  '[data-udx-view]',
];

function queryScrollDrivenCandidates(
  root: ParentNode = document,
): HTMLElement[] {
  const selector = scrollDrivenSelectorParts
    .map((s) => `${s}.animate-in, ${s}.animate-out`)
    .join(', ');
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

function queryJsObserverCandidates(root: ParentNode = document): HTMLElement[] {
  // All animate-in/out that are NOT scroll-driven
  const animated = Array.from(
    root.querySelectorAll<HTMLElement>('.animate-in, .animate-out'),
  );

  return animated.filter((el) => !isScrollDrivenCandidate(el));
}

export const AnimateOnScroll = ({
  children,
  once = true,
}: AnimateOnScrollProps) => {
  const reduced = useMemo(prefersReducedMotion, []);
  const cssSupported = useMemo(() => supportsScrollTimeline(), []);
  const moRef = useRef<MutationObserver | null>(null);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const observedSetRef = useRef<WeakSet<Element> | null>(null);

  useEffect(() => {
    if (reduced) return; // respect reduced motion

    // Setup JS observers for non-scroll-driven animations
    const observed = new WeakSet<Element>();
    observedSetRef.current = observed;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (!isJsObserverCandidate(el)) continue;

          console.log('observed', entry);

          const cls = el.classList;
          const isIn = cls.contains('animate-in');
          const isOut = cls.contains('animate-out');
          if (isIn && entry.isIntersecting) {
            el.setAttribute('data-udx-run', '');
            if (once) io.unobserve(el);
          } else if (isOut && !entry.isIntersecting) {
            // Play exit when leaving viewport
            el.setAttribute('data-udx-run', '');
            if (once) io.unobserve(el);
          } else {
            // Pause when not in the triggering state
            // Do not aggressively remove attribute if once=true and already ran
            if (!once) el.removeAttribute('data-udx-run');
          }
        }
      },
      { threshold: [0, 0.2] },
    );
    ioRef.current = io;

    const observeJsCandidates = (root?: ParentNode) => {
      const candidates = queryJsObserverCandidates(root || document);
      for (const el of candidates) {
        if (observed.has(el)) continue;
        observed.add(el);

        io.observe(el);
      }
    };

    // Initial observe
    observeJsCandidates();

    // Now handle scroll-driven branch per support state
    let cleanupScrollDriven: void | (() => void);

    if (cssSupported) {
      let rafId: number | null = null;
      const schedule = () => {
        if (rafId != null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const els = queryScrollDrivenCandidates();
          for (const el of els) hydrateElement(el);
        });
      };

      // Initial hydration
      schedule();

      // Observe DOM changes to re-hydrate and attach IO to new js candidates
      const mo = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === 'attributes') {
            const t = m.target;
            if (t instanceof HTMLElement) {
              hydrateElement(t as HTMLElement);
              // If an element lost/gained scroll-driven marker, ensure it's observed appropriately
              if (isJsObserverCandidate(t)) {
                if (!observed.has(t)) {
                  observed.add(t);
                  io.observe(t);
                }
              }
            }
          } else if (m.type === 'childList') {
            // new nodes
            if (m.addedNodes && m.addedNodes.length) {
              for (const node of Array.from(m.addedNodes)) {
                if (node instanceof HTMLElement) {
                  // hydrate scroll-driven in subtree
                  const sds = queryScrollDrivenCandidates(node);
                  for (const el of sds) hydrateElement(el);
                  // observe js candidates in subtree
                  observeJsCandidates(node);
                }
              }
            }
          }
        }
      });
      mo.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
          'class',
          'data-udx-view',
          'data-udx-start',
          'data-udx-end',
          'data-udx-paused',
          'data-udx-run',
        ],
      });
      moRef.current = mo;

      cleanupScrollDriven = () => {
        if (rafId != null) cancelAnimationFrame(rafId);
        mo.disconnect();
        moRef.current = null;
      };
    } else {
      // No CSS support: dynamically import the fallback ONLY if there are scroll-driven candidates
      let stop: void | (() => void);
      const existing = queryScrollDrivenCandidates();
      if (existing.length > 0) {
        import('./scrollDriven').then((m) => {
          stop = m.initScrollViewFallback({ once });
        });
      }
      cleanupScrollDriven = () => {
        if (typeof stop === 'function') (stop as () => void)();
      };
    }

    return () => {
      // cleanup both branches
      if (cleanupScrollDriven) cleanupScrollDriven();
      // IO cleanup
      if (ioRef.current) {
        ioRef.current.disconnect();
        ioRef.current = null;
      }
      observedSetRef.current = null;
    };
  }, [cssSupported, reduced, once]);

  // Always return only children; no extra DOM
  return <>{children}</>;
};
