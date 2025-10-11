import { CSSProperties } from 'react';

export type InitAnimationOptions = {
  once?: boolean;
};

// Singleton guard to avoid multiple initializations
let initialized = false;
let teardown: (() => void) | null = null;

function supportsScrollTimeline(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // @ts-ignore
    if (window.CSS && typeof window.CSS.supports === 'function') {
      // @ts-ignore
      return (
        CSS.supports('animation-timeline: view()') ||
        CSS.supports('animation-timeline: scroll()') ||
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

// Map class -> from/to styles
const MAP: Record<string, { from: CSSProperties; to: CSSProperties }> = {
  'animate-fade': { from: { opacity: 0 }, to: { opacity: 1 } },
  'animate-fade-up': {
    from: { opacity: 0, transform: 'translate3d(0, 100px, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'animate-fade-down': {
    from: { opacity: 0, transform: 'translate3d(0, -100px, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'animate-fade-left': {
    from: { opacity: 0, transform: 'translate3d(100px, 0, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'animate-fade-right': {
    from: { opacity: 0, transform: 'translate3d(-100px, 0, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'animate-zoom-in': {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  'animate-zoom-out': {
    from: { opacity: 0.999, transform: 'scale(1.05)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function parseTransformTranslateY(transform?: string): number | null {
  if (!transform) return null;
  const m = transform.match(/translate3d\(\s*([^,]+),\s*([^,]+),\s*([^\)]+)\)/);
  if (m) {
    const y = m[2].trim();
    if (y.endsWith('px')) return parseFloat(y);
  }
  if (transform.startsWith('translateY(')) {
    const v = transform.slice('translateY('.length).replace(')', '').trim();
    if (v.endsWith('px')) return parseFloat(v);
  }
  return null;
}

function applyProgress(el: HTMLElement, from: CSSProperties, to: CSSProperties, p: number) {
  // opacity
  const o0 = from.opacity != null ? Number(from.opacity) : 1;
  const o1 = to.opacity != null ? Number(to.opacity) : 1;
  const op = lerp(o0, o1, p);
  el.style.opacity = String(op);

  // transform (handle translateY and scale simple cases)
  const f = from.transform as string | undefined;
  const t = to.transform as string | undefined;

  const fy = parseTransformTranslateY(f) ?? 0;
  const ty = parseTransformTranslateY(t) ?? 0;
  const y = lerp(fy, ty, p);

  const fs = f?.startsWith('scale(')
    ? Number(f.slice('scale('.length).replace(')', ''))
    : f?.startsWith('scale3d(')
    ? Number(f.split(',')[0].slice('scale3d('.length))
    : 1;
  const ts = t?.startsWith('scale(')
    ? Number(t.slice('scale('.length).replace(')', ''))
    : t?.startsWith('scale3d(')
    ? Number(t.split(',')[0].slice('scale3d('.length))
    : 1;
  const s = lerp(isNaN(fs) ? 1 : fs, isNaN(ts) ? 1 : ts, p);

  const transforms: string[] = [];
  if (y !== 0) transforms.push(`translate3d(0, ${y}px, 0)`);
  if (s !== 1) transforms.push(`scale(${s})`);
  el.style.transform = transforms.length ? transforms.join(' ') : 'none';
}

function findTargetsIn(root: ParentNode): HTMLElement[] {
  const keys = Object.keys(MAP);
  const selectors = keys.map((k) => `.aos-view.${k}`).join(',');
  return Array.from(root.querySelectorAll<HTMLElement>(selectors));
}

export function initScrollAnimations(options: InitAnimationOptions = {}) {
  if (initialized) return teardown || (() => {});
  if (typeof window === 'undefined') return () => {};
  if (supportsScrollTimeline() || prefersReducedMotion()) {
    initialized = true; // No-op in supporting browsers
    return () => {};
  }

  initialized = true;
  const once = options.once ?? true;
  const seen = new WeakSet<Element>();
  let rafId: number | null = null;

  const measure = () => {
    const targets = findTargetsIn(document);
    const vh = window.innerHeight || 0;
    for (const el of targets) {
      const type = Object.keys(MAP).find((k) => el.classList.contains(k));
      if (!type) continue;

      const rect = el.getBoundingClientRect();
      const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      const visibleClamped = Math.max(0, Math.min(visible, rect.height));
      const ratio = rect.height > 0 ? visibleClamped / rect.height : 0;

      // default range align: entry 0% -> cover 30%
      const start = 0;
      const end = 0.3;
      let p = (ratio - start) / (end - start);
      p = Math.max(0, Math.min(1, p));

      if (once && seen.has(el) && p < 1) {
        p = 1;
      }

      const { from, to } = MAP[type];
      applyProgress(el, from, to, p);

      if (p >= 1 && once) {
        seen.add(el);
      }
    }
  };

  const onScroll = () => {
    if (rafId != null) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      measure();
    });
  };

  // Initial run and listeners
  measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  const mo = new MutationObserver(() => {
    onScroll();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

  teardown = () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (rafId != null) cancelAnimationFrame(rafId);
    mo.disconnect();
    initialized = false;
    teardown = null;
  };

  return teardown;
}
