import { CSSProperties } from 'react';

export type InitAnimationOptions = {
  once?: boolean;
};

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

// Helpers to read CSS custom properties used by the Tailwind plugin
function readVar(el: Element, name: string): string | null {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || null;
}

function parsePercentFromRangeToken(token?: string | null): number | null {
  if (!token) return null;
  // Expect patterns like "entry 20%", "cover 80%", "center 60%" etc.
  const parts = token.split(/\s+/);
  const last = parts[parts.length - 1];
  if (!last) return null;
  if (last.endsWith('%')) {
    const n = parseFloat(last);
    if (!isNaN(n)) return Math.max(0, Math.min(100, n)) / 100;
  }
  // px not supported for now (would require element size); fallback null
  return null;
}

function getRange(el: Element): { start: number; end: number } {
  const startToken = readVar(el, '--udx-range-start');
  const endToken = readVar(el, '--udx-range-end');
  const start = parsePercentFromRangeToken(startToken) ?? 0.2; // default entry 20%
  const end = parsePercentFromRangeToken(endToken) ?? 0.5; // default cover 50%
  // Ensure sane ordering
  const s = Math.max(0, Math.min(1, start));
  const e = Math.max(s + 0.001, Math.min(1, end));
  return { start: s, end: e };
}

function num(val: string | null | undefined, unit?: 'px' | 'deg'): number | null {
  if (!val) return null;
  const v = val.trim();
  if (unit && v.endsWith(unit)) {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  // Try plain number
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function applyProgress(el: HTMLElement, from: CSSProperties, to: CSSProperties, p: number) {
  // Opacity
  const o0 = from.opacity != null ? Number(from.opacity) : 1;
  const o1 = to.opacity != null ? Number(to.opacity) : 1;
  const op = lerp(o0, o1, p);
  el.style.opacity = String(op);

  // Transform: translateX/Y (px only), scale, rotate (deg)
  const fx = num((from as any)['--tw-enter-translate-x'] as any) ??
             num((from as any)['--tw-exit-translate-x'] as any) ?? 0;
  const fy = num((from as any)['--tw-enter-translate-y'] as any) ??
             num((from as any)['--tw-exit-translate-y'] as any) ?? 0;
  const tx = num((to as any)['--tw-enter-translate-x'] as any) ??
             num((to as any)['--tw-exit-translate-x'] as any) ?? 0;
  const ty = num((to as any)['--tw-enter-translate-y'] as any) ??
             num((to as any)['--tw-exit-translate-y'] as any) ?? 0;

  const fs = num((from as any)['--tw-enter-scale'] as any) ??
             num((from as any)['--tw-exit-scale'] as any) ?? 1;
  const ts = num((to as any)['--tw-enter-scale'] as any) ??
             num((to as any)['--tw-exit-scale'] as any) ?? 1;

  const fr = num((from as any)['--tw-enter-rotate'] as any) ??
             num((from as any)['--tw-exit-rotate'] as any) ?? 0;
  const tr = num((to as any)['--tw-enter-rotate'] as any) ??
             num((to as any)['--tw-exit-rotate'] as any) ?? 0;

  const x = lerp(fx, tx, p);
  const y = lerp(fy, ty, p);
  const s = lerp(fs, ts, p);
  const r = lerp(fr, tr, p);

  const transforms: string[] = [];
  if (x !== 0 || y !== 0) transforms.push(`translate3d(${x}px, ${y}px, 0)`);
  if (s !== 1) transforms.push(`scale(${s})`);
  if (r !== 0) transforms.push(`rotate(${r}deg)`);
  el.style.transform = transforms.length ? transforms.join(' ') : 'none';
}

function buildFromTo(el: Element): { from: CSSProperties; to: CSSProperties } | null {
  const cls = el.classList;
  const isIn = cls.contains('animate-in');
  const isOut = cls.contains('animate-out');
  if (!isIn && !isOut) return null;

  const cs = getComputedStyle(el as Element);
  const enter = {
    opacity: num(cs.getPropertyValue('--tw-enter-opacity')) ?? undefined,
    '--tw-enter-translate-x': cs.getPropertyValue('--tw-enter-translate-x') || undefined,
    '--tw-enter-translate-y': cs.getPropertyValue('--tw-enter-translate-y') || undefined,
    '--tw-enter-scale': cs.getPropertyValue('--tw-enter-scale') || undefined,
    '--tw-enter-rotate': cs.getPropertyValue('--tw-enter-rotate') || undefined,
  } as CSSProperties & Record<string, any>;
  const exit = {
    opacity: num(cs.getPropertyValue('--tw-exit-opacity')) ?? undefined,
    '--tw-exit-translate-x': cs.getPropertyValue('--tw-exit-translate-x') || undefined,
    '--tw-exit-translate-y': cs.getPropertyValue('--tw-exit-translate-y') || undefined,
    '--tw-exit-scale': cs.getPropertyValue('--tw-exit-scale') || undefined,
    '--tw-exit-rotate': cs.getPropertyValue('--tw-exit-rotate') || undefined,
  } as CSSProperties & Record<string, any>;

  if (isIn) {
    // from enter vars to neutral
    return {
      from: enter,
      to: { opacity: 1, '--tw-enter-translate-x': '0', '--tw-enter-translate-y': '0', '--tw-enter-scale': '1', '--tw-enter-rotate': '0' } as any,
    };
  }
  if (isOut) {
    // from neutral to exit vars
    return {
      from: { opacity: 1, '--tw-exit-translate-x': '0', '--tw-exit-translate-y': '0', '--tw-exit-scale': '1', '--tw-exit-rotate': '0' } as any,
      to: exit,
    };
  }
  return null;
}

function findTargets(): HTMLElement[] {
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
  return Array.from(document.querySelectorAll<HTMLElement>(selector));
}

export function initScrollViewFallback(options: InitAnimationOptions = {}) {
  if (initialized) return teardown || (() => {});
  if (typeof window === 'undefined') return () => {};
  if (supportsScrollTimeline() || prefersReducedMotion()) {
    initialized = true; // No-op in supporting browsers or reduced motion
    return () => {};
  }

  initialized = true;
  const once = options.once ?? true;
  const seen = new WeakSet<Element>();
  let rafId: number | null = null;

  const measure = () => {
    const targets = findTargets();
    const vh = window.innerHeight || 0;
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      const visibleClamped = Math.max(0, Math.min(visible, rect.height));
      const ratio = rect.height > 0 ? visibleClamped / rect.height : 0;

      const { start, end } = getRange(el);
      let p = (ratio - start) / (end - start);
      p = Math.max(0, Math.min(1, p));

      if (once && seen.has(el) && p < 1) p = 1;

      const fe = buildFromTo(el);
      if (!fe) continue;
      const { from, to } = fe;
      applyProgress(el, from, to, p);

      if (p >= 1 && once) seen.add(el);
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
  mo.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

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
