import { springData } from '../spring-data.generated.js';
import type { MotionProvider, VisualFrame } from '../contract.js';

const properties = ['animation-name', 'animation-duration', 'animation-delay', 'animation-timing-function', 'animation-iteration-count', 'animation-direction', 'animation-fill-mode', 'animation-play-state'] as const;
const defaults: Record<string, string> = { 'animation-name': 'none', 'animation-duration': '0s', 'animation-delay': '0s', 'animation-timing-function': 'ease', 'animation-iteration-count': '1', 'animation-direction': 'normal', 'animation-fill-mode': 'none', 'animation-play-state': 'running', 'animation-timeline': 'auto' };
// Effects are shared across schemes; the Set deduplicates equal generated curves.
const tokenEasings = new Set<string>(Object.values(springData).flatMap((group) => group.map((spring) => spring.linear.easing)));
let serial = 0;
let active = 0;
const targets = new WeakSet<HTMLElement>();
function frameStyles(frame: VisualFrame): Record<string, string> {
  return {
    ...(frame.opacity !== undefined && { opacity: String(frame.opacity) }),
    ...((frame.x !== undefined || frame.y !== undefined) && { translate: `${frame.x ?? 0}px ${frame.y ?? 0}px` }),
    ...(frame.scale !== undefined && { scale: String(frame.scale) }),
    ...(frame.rotate !== undefined && { rotate: `${frame.rotate}deg` }),
  };
}

/** Experimental CSS keyframe provider. Requires a connected light-DOM target controlled by
 * the consumer, without author animations or !important rules masking animated properties.
 * Only two complete frames with matching opacity/x/y/scale/rotate fields are supported.
 * Easing accepts standard keywords, steps() and cubic-bezier() without nested
 * functions (including calc()), plus exact generated token linear.easing strings.
 * Other linear() values, substitutions and CSS-wide values are unsupported. Duration and
 * delay remain explicit; callers must select the complete fallback pair when unsupported.
 * Cascade changes and writes between synchronous checks cannot be reliably detected. */
export const cssProvider: MotionProvider = {
  backend: 'css', capabilities: new Set(), activeCount: () => active,
  animate({ target, keyframes, timing, commit }) {
    if (Array.isArray(keyframes) && keyframes.some((frame) => frame?.scaleX !== undefined || frame?.scaleY !== undefined)) throw new RangeError('Unsupported by this provider: scaleX/scaleY');
    if (commit === false) throw new RangeError('Unsupported by this provider: commit');
    const doc = target?.ownerDocument;
    const view = doc?.defaultView;
    if (!view || !(target instanceof view.HTMLElement) || !target.isConnected || target.getRootNode() !== doc) throw new Error('CSS provider requires a connected light-DOM HTMLElement');
    const fields = ['opacity', 'x', 'y', 'scale', 'rotate'];
    if (!Array.isArray(keyframes) || keyframes.length !== 2 || keyframes.some((f) => !f || Object.keys(f).length === 0 || Object.keys(f).some((k) => !fields.includes(k) || !Number.isFinite(f[k as keyof VisualFrame])))) throw new Error('CSS provider requires two finite visual frames');
    const keys = Object.keys(keyframes[0]).sort();
    if (keys.join(',') !== Object.keys(keyframes[1]).sort().join(',')) throw new Error('CSS frames must have matching fields');
    if (!timing || !Number.isFinite(timing.duration) || timing.duration <= 0 || !Number.isFinite(timing.delay ?? 0) || (timing.delay ?? 0) < 0 || typeof timing.easing !== 'string' || !view.CSS.supports('animation-timing-function', timing.easing)) throw new Error('Invalid CSS animation timing');
    const easingProbe = doc.createElement('div').style;
    easingProbe.setProperty('animation-timing-function', timing.easing);
    const easing = easingProbe.getPropertyValue('animation-timing-function');
    if (!tokenEasings.has(timing.easing) && !/^(?:linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end|(?:steps|cubic-bezier)\([^()]*\))$/i.test(easing)) throw new Error('Unsupported CSS animation easing');
    const computed = view.getComputedStyle(target);
    if (targets.has(target) || Object.entries(defaults).some(([p, value]) => { const actual = computed.getPropertyValue(p).trim(); return actual !== '' && actual !== value; }) || target.getAnimations().some((a) => a.constructor.name === 'CSSAnimation')) throw new Error('Target already has animation configuration');
    const frames = keyframes.map(frameStyles);
    const step = /^steps\(\s*(\d+)\s*(?:,\s*(start|end|jump-start|jump-end|jump-none|jump-both)\s*)?\)$/i.exec(easing);
    const stepCount = step ? Number(step[1]) : easing === 'step-start' ? 1 : 0;
    const stepPosition = step?.[2]?.toLowerCase() ?? (easing === 'step-start' ? 'start' : 'end');
    const initialJump = stepPosition === 'start' || stepPosition === 'jump-start' ? 1 / stepCount : stepPosition === 'jump-both' ? 1 / (stepCount + 1) : 0;
    const boundaryFrame = initialJump ? frameStyles(Object.fromEntries(keys.map((key) => {
      const field = key as keyof VisualFrame;
      return [key, keyframes[0][field]! + (keyframes[1][field]! - keyframes[0][field]!) * initialJump];
    })) as VisualFrame) : frames[0];
    const animated = Object.keys(frames[0]);
    if ([...properties, 'animation-timeline', ...animated].some((p) => target.style.getPropertyPriority(p) === 'important')) throw new Error('Important inline styles are unsupported');
    const hadStyle = target.hasAttribute('style');
    const original = new Map(properties.map((p) => [p, [target.style.getPropertyValue(p), target.style.getPropertyPriority(p)] as const]));
    const originalAnimated = new Map(animated.map((p) => [p, [target.style.getPropertyValue(p), target.style.getPropertyPriority(p)] as const]));
    const installed = new Map<string, string>();
    const style = doc.createElement('style');
    const name = `udixio-motion-${Date.now().toString(36)}-${++serial}`;
    let animation: Animation | undefined;
    // Constant properties must also match: an author rule can mask them.
    const frameVisible = (frame: Record<string, string>) => {
      const probe = doc.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;';
      for (const [p, value] of Object.entries(frame)) probe.style.setProperty(p, value, 'important');
      (doc.body || doc.documentElement).append(probe);
      try {
        const expected = view.getComputedStyle(probe); const observed = view.getComputedStyle(target);
        return animated.every((p) => observed.getPropertyValue(p) === expected.getPropertyValue(p));
      } finally { probe.remove(); }
    };
    const endpointVisible = (index: number) => frameVisible(frames[index]);
    const restore = () => { for (const p of properties) { if (target.style.getPropertyValue(p) === installed.get(p) && target.style.getPropertyPriority(p) === '') { const [value, priority] = original.get(p)!; if (value) target.style.setProperty(p, value, priority); else target.style.removeProperty(p); } } if (!hadStyle && target.getAttribute('style') === '') target.removeAttribute('style'); };
    try {
      (doc.head || doc.documentElement).append(style);
      if (!style.sheet) throw new Error('CSS animation stylesheet unavailable');
      const declarations = (frame: Record<string, string>) => Object.entries(frame).map(([p, v]) => `${p}: ${v};`).join(' ');
      style.sheet.insertRule(`@keyframes ${name} { from { ${declarations(frames[0])} } to { ${declarations(frames[1])} } }`);
      const values: Record<typeof properties[number], string> = { 'animation-name': name, 'animation-duration': `${timing.duration}ms`, 'animation-delay': `${timing.delay ?? 0}ms`, 'animation-timing-function': timing.easing, 'animation-iteration-count': '1', 'animation-direction': 'normal', 'animation-fill-mode': 'both', 'animation-play-state': 'running' };
      for (const p of properties) { target.style.setProperty(p, values[p]); installed.set(p, target.style.getPropertyValue(p)); }
      animation = target.getAnimations().find((a) => a.constructor.name === 'CSSAnimation' && (a as CSSAnimation).animationName === name);
      if (!animation) throw new Error('CSS animation could not be created');
      // Keyframe easing can jump at time zero (e.g. step-start), while
      // getComputedTiming().progress still reports the uneased progress.
      if (!endpointVisible(0) && !endpointVisible(1) && !(!(timing.delay ?? 0) && initialJump && frameVisible(boundaryFrame))) throw new Error('CSS animation endpoint is masked');
    } catch (error) { animation?.cancel(); restore(); style.remove(); throw error; }
    const instance = animation;
    targets.add(target); active++;
    let settled = false;
    // Captured before the animation is cancelled, which clears its currentTime.
    let frozen: number | undefined;
    let resolve!: (result: 'finished' | 'cancelled') => void;
    const finished = new Promise<'finished' | 'cancelled'>((done) => { resolve = done; });
    const valid = () => target.isConnected && target.getRootNode() === doc && properties.every((p) => target.style.getPropertyValue(p) === installed.get(p) && target.style.getPropertyPriority(p) === '') && animated.every((p) => target.style.getPropertyValue(p) === originalAnimated.get(p)![0] && target.style.getPropertyPriority(p) === originalAnimated.get(p)![1]) && target.getAnimations().includes(instance);
    const settle = (result: 'finished' | 'cancelled') => {
      if (settled) return;
      frozen = Number(instance.currentTime ?? 0);
      const endpoint = result === 'finished' && valid() ? (endpointVisible(0) ? 0 : endpointVisible(1) ? 1 : undefined) : undefined;
      if (result === 'finished' && endpoint === undefined) result = 'cancelled';
      settled = true;
      if (result === 'finished') {
        try { instance.commitStyles(); } catch {
          for (const [p, value] of Object.entries(frames[endpoint!])) target.style.setProperty(p, value, target.style.getPropertyPriority(p));
        }
        // At a reverse zero-delay jump boundary, the committed value includes
        // the first step even when computed style reports the start.
        const persistedFrame = instance.playbackRate < 0 && !(timing.delay ?? 0) && initialJump ? boundaryFrame : frames[endpoint!];
        // WebKit may silently commit a stale value; persist the validated frame.
        for (const [p, value] of Object.entries(persistedFrame)) target.style.setProperty(p, value, target.style.getPropertyPriority(p));
      }
      instance.cancel(); restore(); style.remove(); targets.delete(target); active--; resolve(result);
    };
    void instance.finished.then(() => settle('finished'), () => settle('cancelled'));
    const run = (operation: () => void) => { if (!settled) { if (!valid()) settle('cancelled'); else operation(); } };
    return { backend: 'css', duration: timing.duration, finished, get currentTime() { return frozen ?? Number(instance.currentTime ?? 0); }, velocity: { value: 0, source: 'unavailable' }, play: () => run(() => instance.play()), pause: () => run(() => instance.pause()), reverse: () => run(() => instance.reverse()), seek: (time) => run(() => { instance.currentTime = time; }), cancel: () => settle('cancelled') };
  },
};
