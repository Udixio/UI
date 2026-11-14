import type { MotionProvider, VisualFrame } from '../contract.js';

function frameToKeyframe(frame: VisualFrame): Keyframe {
  return {
    ...(frame.opacity !== undefined && { opacity: frame.opacity }),
    ...((frame.x !== undefined || frame.y !== undefined) && { translate: `${frame.x ?? 0}px ${frame.y ?? 0}px` }),
    ...(frame.scale !== undefined && { scale: String(frame.scale) }),
    ...(frame.scale === undefined && (frame.scaleX !== undefined || frame.scaleY !== undefined) && { scale: `${frame.scaleX ?? 1} ${frame.scaleY ?? 1}` }),
    ...(frame.rotate !== undefined && { rotate: `${frame.rotate}deg` }),
  };
}

let active = 0;
export const waapiProvider: MotionProvider = {
  backend: 'waapi',
  capabilities: new Set(),
  activeCount: () => active,
  animate({ target, keyframes, timing, commit = true }) {
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
      if (!commit) {
        animation.cancel();
        settle('finished');
        return;
      }
      // Persist the resolved visual state before removing the filling effect.
      // Detached targets cannot always be committed by the browser.
      try {
        animation.commitStyles();
      } catch {
        // A detached element has no computed style to commit. Its endpoint
        // values can still be written directly; omitted values stay underlying.
        const atStart = animation.effect?.getComputedTiming().progress === 0;
        const endpoint = atStart && keyframes.length === 1 ? undefined : keyframes[atStart ? 0 : keyframes.length - 1];
        const frame = endpoint ? frameToKeyframe(endpoint) : {};
        for (const [property, value] of Object.entries(frame)) {
          if (value != null) target.style.setProperty(property, String(value), target.style.getPropertyPriority(property));
        }
      }
      animation.cancel();
      settle('finished');
    }, () => settle('cancelled'));
    return {
      backend: 'waapi', duration: timing.duration, finished,
      velocity: { value: 0, source: 'unavailable' },
      play: () => { if (!settled) animation.play(); },
      pause: () => { if (!settled) animation.pause(); },
      reverse: () => { if (!settled) animation.reverse(); },
      seek: (time) => { if (!settled) animation.currentTime = time; },
      cancel: () => { if (!settled) { settle('cancelled'); animation.cancel(); } },
    };
  },
};
