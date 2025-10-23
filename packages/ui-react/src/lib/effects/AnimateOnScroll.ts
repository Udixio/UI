// Simple script initializer (no React component)

/**
 * AnimateOnScroll
 *
 * Manages triggers for animations:
 * - ScrollDriven animations: use native CSS if supported; otherwise import JS fallback per element set.
 * - Other entry/exit animations: handled via IntersectionObserver in JS.
 */

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

  return Array.from(cls).some((className) => className.startsWith('anim-'));
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

function queryScrollDrivenCandidates(
  root: ParentNode = document,
  prefix: string,
): HTMLElement[] {
  // Select any elements that have an animation class and are marked as scroll-driven
  const animated = Array.from(
    root.querySelectorAll<HTMLElement>(
      `[class*="${prefix}-"][class*="-scroll"]`,
    ),
  );
  return animated.filter((el) => isScrollDrivenCandidate(el));
}

function queryJsObserverCandidates(
  root: ParentNode = document,
  prefix: string,
): HTMLElement[] {
  // Observe any element that has `${prefix}-in` or `${prefix}-out` even if it's scroll-driven.
  // Additionally, observe elements that have at least one non-scroll `${prefix}-*` class
  // (e.g., `anim-fade`, `anim-scale-150`) even if they also include scroll-driven classes.
  // This ensures default IN animations are triggered.
  const animated = Array.from(
    root.querySelectorAll<HTMLElement>(`[class*="${prefix}-"]`),
  );

  const reserved = new Set([
    `${prefix}-run`,
    `${prefix}-in`,
    `${prefix}-out`,
    `${prefix}-in-run`,
    `${prefix}-out-run`,
    `${prefix}-paused`,
    `${prefix}-timeline`,
    `${prefix}-timeline-inline`,
    `${prefix}-timeline-block`,
    `${prefix}-timeline-x`,
    `${prefix}-timeline-y`,
    `${prefix}-scroll`,
  ]);

  return animated.filter((el) => {
    if (!(el instanceof HTMLElement)) return false;
    const cls = el.classList;
    const hasInOut =
      cls.contains(`${prefix}-in`) || cls.contains(`${prefix}-out`);
    if (hasInOut) return true;

    // Check if element has any non-scroll animation class (not in reserved set and not containing "scroll")
    const hasNonScrollAnim = Array.from(cls).some(
      (c) =>
        c.startsWith(`${prefix}-`) && !c.includes('scroll') && !reserved.has(c),
    );

    if (hasNonScrollAnim) return true;

    // Otherwise only observe if it's not scroll-driven at all
    return !isScrollDrivenCandidate(el);
  });
}

// Utility: identify presence of in/out classes
function hasInOutClass(cls: DOMTokenList, prefix: string): boolean {
  return cls.contains(`${prefix}-in`) || cls.contains(`${prefix}-out`);
}

// Utility: set run flags for a given direction ("in" or "out"), always ensuring generic run flag exists
function setRunFlag(el: HTMLElement, prefix: string, dir: 'in' | 'out'): void {
  el.setAttribute(`data-${prefix}-run`, ``);
  el.setAttribute(`data-${prefix}-${dir}-run`, ``);
}

// Utility: reset run flags and restart animation timeline without changing computed styles
function resetRunFlags(el: HTMLElement, prefix: string): void {
  const currentAnimationName = el.style.animationName;
  el.style.animationName = 'none';
  el.removeAttribute(`data-${prefix}-run`);
  el.removeAttribute(`data-${prefix}-in-run`);
  el.removeAttribute(`data-${prefix}-out-run`);
  void (el as HTMLElement).offsetWidth; // reflow to restart animations
  el.style.animationName = currentAnimationName;
}

// IO thresholds centralized for clarity
const IO_THRESHOLD: number[] = [0, 0.2];

// Track which elements have animation lifecycle listeners attached
const listenersAttached = new WeakSet<Element>();

function addAnimationLifecycle(el: HTMLElement, prefix: string): void {
  if (listenersAttached.has(el)) return;
  listenersAttached.add(el);

  const onStart = (e: AnimationEvent) => {
    if (e.target !== el) return;
    // Only mark as animating if this animation was initiated by our run flags.
    // This avoids setting data-{prefix}-animating during hydration or passive CSS animations
    // which would block the initial in/out trigger from IntersectionObserver.
    if (
      el.hasAttribute(`data-${prefix}-in-run`) ||
      el.hasAttribute(`data-${prefix}-out-run`)
    ) {
      el.setAttribute(`data-${prefix}-animating`, ``);
    }
  };

  const onEndOrCancel = (e: AnimationEvent) => {
    if (e.target !== el) return;
    el.removeAttribute(`data-${prefix}-animating`);
    // Clear directional run flags so a new trigger can happen after completion
    el.removeAttribute(`data-${prefix}-in-run`);
    el.removeAttribute(`data-${prefix}-out-run`);
    // Note: keep generic data-{prefix}-run for style stability
  };

  el.addEventListener('animationstart', onStart as EventListener);
  el.addEventListener('animationend', onEndOrCancel as EventListener);
  el.addEventListener('animationcancel', onEndOrCancel as EventListener);
}

export type AnimateOnScrollOptions = {
  prefix?: string;
  once?: boolean;
};

export function initAnimateOnScroll(
  options: AnimateOnScrollOptions = {},
): () => void {
  const { prefix = 'anim', once = true } = options;

  if (prefersReducedMotion()) {
    return () => {};
  }

  const cssSupported = supportsScrollTimeline();

  // Setup JS observers for non-scroll-driven animations
  const observed = new WeakSet<Element>();

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;

        if (!isJsObserverCandidate(el)) continue;

        // If an animation is in progress, avoid re-triggering or flipping direction
        if (el.hasAttribute(`data-${prefix}-animating`)) continue;

        const isOut = el.classList.contains(`${prefix}-out`);

        if (!isOut && entry.isIntersecting) {
          setRunFlag(el, prefix, 'in');
          if (once) io.unobserve(el);
        } else if (isOut && !entry.isIntersecting) {
          setRunFlag(el, prefix, 'out');
          if (once) io.unobserve(el);
        } else if (!once) {
          // Only reset flags if not currently animating (already checked), to prevent rapid restarts
          resetRunFlags(el, prefix);
        }
      }
    },
    { threshold: IO_THRESHOLD },
  );

  const observeJsCandidates = (root?: ParentNode) => {
    const candidates = queryJsObserverCandidates(root || document, prefix);
    for (const el of candidates) {
      if (observed.has(el)) continue;
      observed.add(el);
      io.observe(el);
      addAnimationLifecycle(el, prefix);
    }
  };

  // Initial observe
  observeJsCandidates();

  // Scroll-driven branch per support state
  let cleanupScrollDriven: void | (() => void);
  let mo: MutationObserver | null = null;
  let rafId: number | null = null;

  if (cssSupported) {
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

    mo = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === `attributes`) {
          const t = m.target;
          if (t instanceof HTMLElement) {
            hydrateElement(t as HTMLElement, prefix);
            if (isJsObserverCandidate(t)) {
              if (!observed.has(t)) {
                observed.add(t);
                io.observe(t);
                addAnimationLifecycle(t as HTMLElement, prefix);
              }
            }
          }
        } else if (m.type === `childList`) {
          if (m.addedNodes && m.addedNodes.length) {
            for (const node of Array.from(m.addedNodes)) {
              if (node instanceof HTMLElement) {
                const sds = queryScrollDrivenCandidates(node, prefix);
                for (const el of sds) hydrateElement(el, prefix);
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

    cleanupScrollDriven = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      if (mo) mo.disconnect();
    };
  } else {
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

  // Public cleanup
  return () => {
    if (cleanupScrollDriven) cleanupScrollDriven();
    io.disconnect();
  };
}

// Backward-compatible alias name (non-React):
export const AnimateOnScrollInit = initAnimateOnScroll;
export const animateOnScroll = initAnimateOnScroll;
