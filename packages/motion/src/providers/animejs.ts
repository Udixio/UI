import { animate } from 'animejs';
import type { MotionProvider, VisualFrame } from '../contract.js';

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
  activeCount: () => active,
  animate({ target, keyframes, timing }) {
    let settled = false;
    let resolve!: (result: 'finished' | 'cancelled') => void;
    const finished = new Promise<'finished' | 'cancelled'>((done) => { resolve = done; });
    const settle = (result: 'finished' | 'cancelled') => {
      if (settled) return;
      settled = true;
      active--;
      resolve(result);
    };
    const frames = Object.fromEntries(keyframes.map((frame, index) => [
      `${keyframes.length === 1 ? 100 : index * 100 / (keyframes.length - 1)}%`, frameToKeyframe(frame),
    ]));
    const bezier = timing.easing.match(/^cubic-bezier\s*\(([^)]+)\)$/i);
    const computed = getComputedStyle(target);
    const properties = new Set(keyframes.flatMap((frame) => Object.keys(frameToKeyframe(frame))));
    const values: Record<string, string | number> = {};
    for (const property of properties) {
      const cssProperty = property as 'opacity' | 'translate' | 'scale' | 'rotate';
      const value = computed[cssProperty];
      values[cssProperty] = value === 'none'
        ? ({ translate: '0px 0px', scale: '1', rotate: '0deg', opacity: '1' })[cssProperty]
        : value;
    }
    active++;
    let animation: ReturnType<typeof animate>;
    try {
      animation = animate(values, {
        keyframes: frames, duration: timing.duration, ...(timing.delay !== undefined && { delay: timing.delay }),
        ease: bezier ? `cubicBezier(${bezier[1]})` : 'linear',
        onRender: () => {
          for (const property of properties) {
            const cssProperty = property as 'opacity' | 'translate' | 'scale' | 'rotate';
            target.style[cssProperty] = String(values[cssProperty]);
          }
        },
        autoplay: true, onComplete: () => settle('finished'),
      });
    } catch (error) {
      active--;
      throw error;
    }
    return {
      backend: 'animejs', duration: timing.duration, finished,
      play: () => { if (!settled) animation.play(); },
      pause: () => { if (!settled) animation.pause(); },
      reverse: () => { if (!settled) animation.reverse(); },
      seek: (time) => { if (!settled) animation.seek(time); },
      cancel: () => { if (!settled) { settle('cancelled'); animation.cancel(); } },
    };
  },
};
