import { ReactNode, useEffect, useMemo, useRef } from 'react';

/**
 * AnimateOnScroll
 *
 * Manages triggers for animations:
 * - ScrollDriven animations: use native CSS if supported; otherwise import JS fallback per element set.
 * - Other entry/exit animations: handled via IntersectionObserver in JS.
 */

export type AnimateOnScrollProps = {
  prefix?: string;
  children?: ReactNode;
  once?: boolean; // if true in JS modes, animate only first time per element
};

function supportsScrollTimeline(): boolean {
  if (typeof window === `undefined`) return false;
  try {
    // @ts-ignore - CSS may not exist in TS lib
    if (window.CSS && typeof window.CSS.supports === `function`) {
      // @ts-ignore
      return (
        CSS.supports(`animation-timeline: view()`) ||
        CSS.supports(`animation-timeline: scroll()`) ||
        // some older implementations used view-timeline-name
        CSS.supports(`view-timeline-name: --a`)
      );
    }
  } catch {}
  return false;
}

function prefersReducedMotion(): boolean {
  if (typeof window === `undefined` || !(`matchMedia` in window)) return false;
  return window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;
}

function isScrollDrivenCandidate(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const cls = el.classList;

  return Array.from(cls).some(
    (className) =>
      className.startsWith('anim-') && className.includes('scroll'),
  );
}
function isJsObserverCandidate(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const cls = el.classList;
  const hasAnimation = Array.from(cls).some((className) =>
    className.startsWith('anim-'),
  );
  if (!hasAnimation) return false;
  // Not scroll-driven
  return !isScrollDrivenCandidate(el);
}


function hydrateElement(el: HTMLElement, prefix: string): void {
  if (!isScrollDrivenCandidate(el)) return;

  // Map data-anim-scroll to correct axis class if provided
  if (el.hasAttribute(`data-${prefix}-scroll`)) {
    const raw = (el.getAttribute(`data-${prefix}-scroll`) || ``)
      .trim()
      .toLowerCase();
    const axis =
      raw === `x` || raw === `inline`
        ? `inline`
        : raw === `y` || raw === `block`
          ? `block`
          : `auto`;
    const hasAny =
      el.classList.contains(`${prefix}-timeline`) ||
      el.classList.contains(`${prefix}-timeline-inline`) ||
      el.classList.contains(`${prefix}-timeline-block`) ||
      el.classList.contains(`${prefix}-timeline-x`) ||
      el.classList.contains(`${prefix}-timeline-y`);
    if (!hasAny) {
      if (axis === `inline`) el.classList.add(`${prefix}-timeline-inline`);
      else if (axis === `block`) el.classList.add(`${prefix}-timeline-block`);
      else el.classList.add(`${prefix}-scroll`);
    }
  }

  // Offsets via data-anim-start / data-anim-end (accepts tokens like "entry 20%", "cover 50%", etc.)
  const start = el.getAttribute(`data-${prefix}-start`);
  if (start) el.style.setProperty(`--${prefix}-range-start`, start);
  const end = el.getAttribute(`data-${prefix}-end`);
  if (end) el.style.setProperty(`--${prefix}-range-end`, end);

  // Ensure play state is running unless explicitly paused
  const explicitlyPaused =
    el.hasAttribute(`data-${prefix}-paused`) ||
    el.classList.contains(`${prefix}-paused`);
  const alreadyRunning =
    el.hasAttribute(`data-${prefix}-run`) ||
    el.classList.contains(`${prefix}-run`);
  if (!explicitlyPaused && !alreadyRunning) {
    el.setAttribute(`data-${prefix}-run`, ``);
  }

}

const scrollDrivenSelectorParts = (prefix: string) => [
  `.${prefix}-timeline`,
  `.${prefix}-timeline-x`,
  `.${prefix}-timeline-y`,
  `.${prefix}-timeline-inline`,
  `.${prefix}-timeline-block`,
  `[data-${prefix}-scroll]`,
];

function queryScrollDrivenCandidates(
  root: ParentNode = document,
  prefix: string,
): HTMLElement[] {
  // Select any elements that have an animation class and are marked as scroll-driven
  const animated = Array.from(
    root.querySelectorAll<HTMLElement>(`[class*="${prefix}-"]`),
  );
  return animated.filter((el) => isScrollDrivenCandidate(el));
}

function queryJsObserverCandidates(
  root: ParentNode = document,
  prefix: string,
): HTMLElement[] {
  // All anim-in/out that are NOT scroll-driven
  const animated = Array.from(
    root.querySelectorAll<HTMLElement>(`[class*="anim-"]`),
  );

  return animated.filter((el) => !isScrollDrivenCandidate(el));
}

export const AnimateOnScroll = ({
  prefix = 'anim',
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

          if (!isJsObserverCandidate(el)) {
            continue;
          }

          const cls = el.classList;
          const isOut = cls.contains(`${prefix}-out`);
          const isIn = !isOut;

          if (isIn && entry.isIntersecting) {
            el.setAttribute(`data-${prefix}-in-run`, ``);
            if (once) io.unobserve(el);
          } else if (isOut && !entry.isIntersecting) {
            // Play exit when leaving viewport
            el.setAttribute(`data-${prefix}-out-run`, ``);
            if (once) io.unobserve(el);
          } else {
            // Pause when not in the triggering state
            // Do not aggressively remove attribute if once=true and already ran
            if (!once) {
              // Store current animation name
              const currentAnimationName = el.style.animationName;
              // Remove animation name
              el.style.animationName = 'none';
              el.removeAttribute(`data-${prefix}-in-run`);
              el.removeAttribute(`data-${prefix}-out-run`);
              void el.offsetWidth; // reflow
              // Re-apply animation name
              el.style.animationName = currentAnimationName;
            }
          }
        }
      },
      { threshold: [0, 0.2] },
    );
    ioRef.current = io;

    const observeJsCandidates = (root?: ParentNode) => {
      const candidates = queryJsObserverCandidates(root || document, prefix);
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
          const els = queryScrollDrivenCandidates(undefined, prefix);
          for (const el of els) hydrateElement(el, prefix);
        });
      };

      // Initial hydration
      schedule();

      // Observe DOM changes to re-hydrate and attach IO to new js candidates
      const mo = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === `attributes`) {
            const t = m.target;
            if (t instanceof HTMLElement) {
              hydrateElement(t as HTMLElement, prefix);
              // If an element lost/gained scroll-driven marker, ensure it`s observed appropriately
              if (isJsObserverCandidate(t)) {
                if (!observed.has(t)) {
                  observed.add(t);
                  io.observe(t);
                }
              }
            }
          } else if (m.type === `childList`) {
            // new nodes
            if (m.addedNodes && m.addedNodes.length) {
              for (const node of Array.from(m.addedNodes)) {
                if (node instanceof HTMLElement) {
                  // hydrate scroll-driven in subtree
                  const sds = queryScrollDrivenCandidates(node, prefix);
                  for (const el of sds) hydrateElement(el, prefix);
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
          `class`,
          `data-${prefix}-scroll`,
          `data-${prefix}-start`,
          `data-${prefix}-end`,
          `data-${prefix}-paused`,
          `data-${prefix}-run`,
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
      const existing = queryScrollDrivenCandidates(undefined, prefix);
      if (existing.length > 0) {
        import(`./scrollDriven`).then((m) => {
          stop = m.initScrollViewFallback({ once });
        });
      }
      cleanupScrollDriven = () => {
        if (typeof stop === `function`) (stop as () => void)();
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
