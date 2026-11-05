import type { MotionProvider, VisualFrame } from '../contract.js';

function frameToKeyframe(frame: VisualFrame): Keyframe {
  return {
    ...(frame.opacity !== undefined && { opacity: frame.opacity }),
    ...((frame.x !== undefined || frame.y !== undefined) && { translate: `${frame.x ?? 0}px ${frame.y ?? 0}px` }),
    ...(frame.scale !== undefined && { scale: String(frame.scale) }),
    ...(frame.rotate !== undefined && { rotate: `${frame.rotate}deg` }),
  };
}

let active = 0;
export const waapiProvider: MotionProvider = {
  backend: 'waapi',
  activeCount: () => active,
  animate({ target, keyframes, timing }) {
    const animation = target.animate(keyframes.map(frameToKeyframe), { ...timing, fill: 'both' });
    active++;
    let settled = false;
    let resolve!: (result: 'finished' | 'cancelled') => void;
    const finished = new Promise<'finished' | 'cancelled'>((done) => { resolve = done; });
    const settle = (result: 'finished' | 'cancelled') => {
      if (settled) return;
      settled = true;
      active--;
      resolve(result);
    };
    void animation.finished.then(() => {
      // Persist the resolved visual state before removing the filling effect.
      // Detached targets cannot always be committed by the browser.
      try { animation.commitStyles(); } catch { /* The target may be detached. */ }
      animation.cancel();
      settle('finished');
    }, () => settle('cancelled'));
    return {
      backend: 'waapi', duration: timing.duration, finished,
      play: () => { if (!settled) animation.play(); },
      pause: () => { if (!settled) animation.pause(); },
      reverse: () => { if (!settled) animation.reverse(); },
      seek: (time) => { if (!settled) animation.currentTime = time; },
      cancel: () => { if (!settled) { settle('cancelled'); animation.cancel(); } },
    };
  },
};
