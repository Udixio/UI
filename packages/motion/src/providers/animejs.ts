import { animate } from 'animejs';
import type { MotionProvider, VisualFrame } from '../contract.js';
import { animejsEase } from '../ease.js';

function frameToKeyframe(frame: VisualFrame): Record<string, number | string> {
  return {
    ...(frame.opacity !== undefined && { opacity: frame.opacity }),
    ...((frame.x !== undefined || frame.y !== undefined) && { translate: `${frame.x ?? 0}px ${frame.y ?? 0}px` }),
    ...(frame.scale !== undefined && { scale: frame.scale }),
    ...(frame.rotate !== undefined && { rotate: `${frame.rotate}deg` }),
  };
}

let active = 0;
export const animejsProvider: MotionProvider = {
  backend: 'animejs',
  capabilities: new Set(),
  activeCount: () => active,
  animate({ target, keyframes, timing, commit, styles }) {
    if (styles) throw new RangeError('Unsupported by this provider: styles');
    if (Array.isArray(keyframes) && keyframes.some((frame) => frame?.scaleX !== undefined || frame?.scaleY !== undefined)) throw new RangeError('Unsupported by this provider: scaleX/scaleY');
    if (Array.isArray(keyframes) && keyframes.some((frame) => frame?.draw !== undefined || frame?.along !== undefined)) throw new RangeError('Unsupported by this provider: draw/along');
    if (commit === false) throw new RangeError('Unsupported by this provider: commit');
    if (timing.iterations !== undefined && timing.iterations !== 1) throw new RangeError('Unsupported by this provider: iterations');
    const ease = animejsEase(timing.easing);
    let settled = false;
    let resolve!: (result: 'finished' | 'cancelled') => void;
    const finished = new Promise<'finished' | 'cancelled'>((done) => { resolve = done; });
    const settle = (result: 'finished' | 'cancelled') => {
      if (settled) return;
      settled = true;
      active--;
      resolve(result);
    };
    // Anime.js runs on the active timeline; the handle reports the delay-inclusive
    // time, the inverse of the mapping its seek applies.
    let frozen: number | undefined;
    const live = () => animation.currentTime + (timing.delay ?? 0);
    const frames = Object.fromEntries(keyframes.map((frame, index) => [
      `${keyframes.length === 1 ? 100 : index * 100 / (keyframes.length - 1)}%`, frameToKeyframe(frame),
    ]));
    const view = target.ownerDocument.defaultView;
    if (!view) throw new Error('The target document has no window');
    const computed = view.getComputedStyle(target);
    const properties = new Set(keyframes.flatMap((frame) => Object.keys(frameToKeyframe(frame))));
    const values: Record<string, string | number> = {};
    const inlineStyles = new Map<string, { value: string; priority: string }>();
    const lastWritten = new Map<string, { value: string; priority: string }>();
    for (const property of properties) {
      const cssProperty = property as 'opacity' | 'translate' | 'scale' | 'rotate';
      const value = computed[cssProperty];
      inlineStyles.set(property, {
        value: target.style.getPropertyValue(property),
        priority: target.style.getPropertyPriority(property),
      });
      values[cssProperty] = value === 'none'
        ? ({ translate: '0px 0px', scale: '1', rotate: '0deg', opacity: '1' })[cssProperty]
        : value;
    }
    frames['0%'] ??= {};
    frames['100%'] ??= {};
    for (const property of properties) {
      frames['0%'][property] ??= values[property];
      frames['100%'][property] ??= values[property];
    }
    const renderValues = () => {
      for (const property of properties) {
        const cssProperty = property as 'opacity' | 'translate' | 'scale' | 'rotate';
        target.style[cssProperty] = String(values[cssProperty]);
        lastWritten.set(property, {
          value: target.style.getPropertyValue(property),
          priority: target.style.getPropertyPriority(property),
        });
      }
    };
    active++;
    let animation: ReturnType<typeof animate>;
    try {
      animation = animate(values, {
        keyframes: frames, duration: timing.duration, ...(timing.delay !== undefined && { delay: timing.delay }),
        ease,
        onRender: renderValues,
        autoplay: true, onComplete: () => { frozen ??= (timing.delay ?? 0) + timing.duration; settle('finished'); },
      });
    } catch (error) {
      active--;
      throw error;
    }
    return {
      backend: 'animejs', duration: timing.duration, delay: timing.delay ?? 0, finished,
      get currentTime() { return frozen ?? live(); },
      velocity: { value: 0, source: 'unavailable' },
      play: () => { if (!settled) animation.play(); },
      pause: () => { if (!settled) animation.pause(); },
      reverse: () => { if (!settled) animation.reverse(); },
      seek: (time) => {
        if (!settled) {
          // Anime.js seeks within the active duration; expose the same
          // delay-inclusive timeline as WAAPI to callers.
          const activeTime = time - (timing.delay ?? 0);
          animation.seek(activeTime);
          if (activeTime <= 0) {
            Object.assign(values, frames['0%']);
            renderValues();
          }
        }
      },
      cancel: () => {
        if (!settled) {
          frozen ??= live();
          animation.cancel();
          for (const [property, { value, priority }] of inlineStyles) {
            const written = lastWritten.get(property);
            if (!written || target.style.getPropertyValue(property) !== written.value ||
                target.style.getPropertyPriority(property) !== written.priority) continue;
            if (value) target.style.setProperty(property, value, priority);
            else target.style.removeProperty(property);
          }
          settle('cancelled');
        }
      },
    };
  },
};
