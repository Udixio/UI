import React, { CSSProperties, ReactNode, useEffect, useMemo, useRef } from 'react';

export type AnimateOnScrollProps = {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children?: ReactNode;
  once?: boolean; // if true in JS fallback, animate only first time fully visible per element
  threshold?: number; // reserved for future use
  style?: CSSProperties;
};

// Map class -> from styles
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
    // use Y component
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

  // transform (handle translate3d and scale simple cases)
  const f = from.transform as string | undefined;
  const t = to.transform as string | undefined;

  // translateY
  const fy = parseTransformTranslateY(f) ?? 0;
  const ty = parseTransformTranslateY(t) ?? 0;
  const y = lerp(fy, ty, p);

  // scale
  const fs = f?.startsWith('scale(') ? Number(f.slice('scale('.length).replace(')', '')) : (f?.startsWith('scale3d(') ? Number(f.split(',')[0].slice('scale3d('.length)) : (f?.startsWith('scale') ? 1 : (f?.includes('scale(') ? 1 : (f?.includes('scale3d(') ? 1 : (f?.includes('scaleX(') ? 1 : (f?.includes('scaleY(') ? 1 : 1))))));
  const ts = t?.startsWith('scale(') ? Number(t.slice('scale('.length).replace(')', '')) : (t?.startsWith('scale3d(') ? Number(t.split(',')[0].slice('scale3d('.length)) : (t ? 1 : 1));
  const s = lerp(isNaN(fs) ? 1 : fs, isNaN(ts) ? 1 : ts, p);

  const transforms: string[] = [];
  if (y !== 0) transforms.push(`translate3d(0, ${y}px, 0)`);
  if (s !== 1) transforms.push(`scale(${s})`);
  if (transforms.length) {
    el.style.transform = transforms.join(' ');
  } else {
    el.style.transform = 'none';
  }
}

function findTargets(root: HTMLElement): HTMLElement[] {
  const selectors = Object.keys(MAP).join(',');
  return Array.from(root.querySelectorAll<HTMLElement>(selectors));
}

const AnimateOnScrollFallback = ({
  as = 'div',
  className,
  children,
  once = true,
  style,
}: AnimateOnScrollProps) => {
  const Tag = as as any;
  const ref = useRef<HTMLElement | null>(null);
  const seen = useRef<WeakSet<Element>>(new WeakSet());
  const rafRef = useRef<number | null>(null);

  const computedStyle: CSSProperties = useMemo(() => {
    const s: CSSProperties = { ...style };
    return s;
  }, [style]);

  useEffect(() => {
    if (!ref.current) return;
    const root = ref.current;

    const targets = findTargets(root);

    const measure = () => {
      const vh = window.innerHeight || 0;
      for (const el of targets) {
        const types = Object.keys(MAP).filter((k) => el.classList.contains(k));
        if (types.length === 0) continue;
        const rect = el.getBoundingClientRect();
        const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
        const visibleClamped = Math.max(0, Math.min(visible, rect.height));
        const ratio = rect.height > 0 ? visibleClamped / rect.height : 0;

        // default range: entry 0% cover 30%
        const start = 0;
        const end = 0.3;
        let p = (ratio - start) / (end - start);
        p = Math.max(0, Math.min(1, p));

        if (once && seen.current.has(el) && p < 1) {
          // keep final state
          p = 1;
        }

        const { from, to } = MAP[types[0]]; // first matching animate-* wins
        applyProgress(el, from, to, p);

        if (p >= 1 && once) {
          seen.current.add(el);
        }
      }
    };

    const onScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        measure();
      });
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    const mo = new MutationObserver(() => {
      // Recompute targets if DOM changes within
      onScroll();
    });
    mo.observe(root, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      mo.disconnect();
    };
  }, [once]);

  return (
    <Tag ref={ref as any} className={className} style={computedStyle}>
      {children}
    </Tag>
  );
};

export default AnimateOnScrollFallback;
