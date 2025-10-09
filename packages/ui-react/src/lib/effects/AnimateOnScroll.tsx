import React, {
  CSSProperties,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
} from 'react';

/**
 * AnimateOnScroll
 *
 * A lightweight AOS-like component that prefers CSS Scroll-Driven Animations
 * and falls back to a JS-based IntersectionObserver when unsupported.
 *
 * Usage example:
 * <AnimateOnScroll animate="fade-up" duration={600}>
 *   <Card>...</Card>
 * </AnimateOnScroll>
 */

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
  duration?: number; // ms
  delay?: number; // ms
  easing?: string; // CSS easing function
  range?: string; // CSS animation-range, e.g. 'entry 0% cover 30%'
  once?: boolean; // if true in JS fallback, animate only first time
  threshold?: number; // IO threshold for JS fallback
  style?: CSSProperties;
};

// Keyframes map (from -> to) used for both CSS and JS fallback
const KEYFRAMES: Record<
  AnimateOnScrollType,
  { from: CSSProperties; to: CSSProperties }
> = {
  fade: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  'fade-up': {
    from: { opacity: 0, transform: 'translate3d(0, 16px, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'fade-down': {
    from: { opacity: 0, transform: 'translate3d(0, -16px, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'fade-left': {
    from: { opacity: 0, transform: 'translate3d(16px, 0, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'fade-right': {
    from: { opacity: 0, transform: 'translate3d(-16px, 0, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  'zoom-in': {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  'zoom-out': {
    from: { opacity: 0.999, transform: 'scale(1.05)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
};

const STYLE_TAG_ID = 'udx-animate-on-scroll-styles';

function injectKeyframesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_TAG_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_TAG_ID;

  const cssParts: string[] = [];
  const toDecl = (obj: CSSProperties) =>
    Object.entries(obj)
      .map(([k, v]) => `${camelToKebab(k)}:${v}`)
      .join(';');

  const defs: Record<AnimateOnScrollType, string> = {
    fade: 'udx-aos-fade',
    'fade-up': 'udx-aos-fade-up',
    'fade-down': 'udx-aos-fade-down',
    'fade-left': 'udx-aos-fade-left',
    'fade-right': 'udx-aos-fade-right',
    'zoom-in': 'udx-aos-zoom-in',
    'zoom-out': 'udx-aos-zoom-out',
  };

  (Object.keys(defs) as AnimateOnScrollType[]).forEach((key) => {
    const name = defs[key];
    const frames = KEYFRAMES[key];
    cssParts.push(
      `@keyframes ${name}{0%{${toDecl(frames.from)}}100%{${toDecl(frames.to)}}}`,
    );
  });

  style.textContent = cssParts.join('\n');
  document.head.appendChild(style);
}

function camelToKebab(str: string) {
  return str.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

function supportsScrollTimeline(): boolean {
  if (typeof window === 'undefined') return false;
  // Prefer animation-timeline: view(); some engines may support scroll(); include either
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

export const AnimateOnScroll = ({
  as = 'div',
  className,
  children,
  animate = 'fade-up',
  duration = 600,
  delay = 0,
  easing = 'cubic-bezier(0.2, 0.0, 0, 1.0)',
  range = 'entry 0% cover 30%',
  once = true,
  threshold = 0.2,
  style,
}: AnimateOnScrollProps) => {
  const Tag = as as any;
  const ref = useRef<HTMLElement | null>(null);

  const reduced = useMemo(prefersReducedMotion, []);
  const cssSupported = useMemo(() => supportsScrollTimeline(), []);

  useEffect(() => {
    if (reduced) return; // respect reduced motion
    if (cssSupported) injectKeyframesOnce();
  }, [cssSupported, reduced]);

  // JS fallback: IntersectionObserver to set styles on visibility
  useEffect(() => {
    if (reduced) return;
    if (cssSupported) return; // no need for JS
    const el = ref.current as HTMLElement | null;
    if (!el) return;

    const frames = KEYFRAMES[animate];

    // initialize to starting state
    applyInitial(el, frames.from);

    const transition = `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`;
    el.style.transition = transition;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            applyFinal(el, frames.to);
            if (once) io.unobserve(el);
          } else if (!once) {
            applyInitial(el, frames.from);
          }
        });
      },
      { threshold },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [
    animate,
    cssSupported,
    delay,
    duration,
    easing,
    once,
    threshold,
    reduced,
  ]);

  const computedStyle: CSSProperties = useMemo(() => {
    const s: CSSProperties = { ...style };
    if (reduced) return s; // do nothing
    if (cssSupported) {
      const keyName = animationKeyName(animate);
      s.animationName = keyName;
      s.animationDuration = `${duration}ms`;
      s.animationDelay = `${delay}ms`;
      s.animationTimingFunction = easing;
      s.animationFillMode = 'both';
      // @ts-ignore new properties not in TS yet
      s.animationTimeline = 'view()';
      // @ts-ignore
      s.animationRange = range;
      // Provide sensible will-change hints
      s.willChange = 'opacity, transform';
      return s;
    }
    // JS fallback initial state applied via effect; still provide will-change
    s.willChange = 'opacity, transform';
    return s;
  }, [animate, cssSupported, delay, duration, easing, range, style, reduced]);

  return (
    <Tag ref={ref as any} className={className} style={computedStyle}>
      {children}
    </Tag>
  );
};

function animationKeyName(type: AnimateOnScrollType): string {
  switch (type) {
    case 'fade':
      return 'udx-aos-fade';
    case 'fade-up':
      return 'udx-aos-fade-up';
    case 'fade-down':
      return 'udx-aos-fade-down';
    case 'fade-left':
      return 'udx-aos-fade-left';
    case 'fade-right':
      return 'udx-aos-fade-right';
    case 'zoom-in':
      return 'udx-aos-zoom-in';
    case 'zoom-out':
      return 'udx-aos-zoom-out';
    default:
      return 'udx-aos-fade-up';
  }
}

function applyInitial(el: HTMLElement, from: CSSProperties) {
  if (from.opacity != null) el.style.opacity = String(from.opacity);
  if (from.transform != null) el.style.transform = String(from.transform);
}

function applyFinal(el: HTMLElement, to: CSSProperties) {
  if (to.opacity != null) el.style.opacity = String(to.opacity);
  // For final transform we assume identity when undefined
  el.style.transform = to.transform ? String(to.transform) : 'none';
}
