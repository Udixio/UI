import type { MotionHandle, MotionProvider, VisualFrame } from '../contract.js';

export function frameToKeyframe(frame: VisualFrame): Keyframe {
  return {
    ...(frame.opacity !== undefined && { opacity: frame.opacity }),
    ...((frame.x !== undefined || frame.y !== undefined) && { translate: `${frame.x ?? 0}px ${frame.y ?? 0}px` }),
    ...(frame.scale !== undefined && { scale: String(frame.scale) }),
    ...(frame.scale === undefined && (frame.scaleX !== undefined || frame.scaleY !== undefined) && { scale: `${frame.scaleX ?? 1} ${frame.scaleY ?? 1}` }),
    ...(frame.rotate !== undefined && { rotate: `${frame.rotate}deg` }),
  };
}

/**
 * The handle of one WAAPI move. `currentTime` is an accessor of the class: written as an accessor in the object
 * literal of each move, it made every move of the layout engine measurably slower.
 */
class WaapiMove implements MotionHandle {
  readonly backend = 'waapi';
  readonly velocity: MotionHandle['velocity'] = { value: 0, source: 'unavailable' };
  readonly play: MotionHandle['play'];
  readonly pause: MotionHandle['pause'];
  readonly reverse: MotionHandle['reverse'];
  readonly seek: MotionHandle['seek'];
  readonly cancel: MotionHandle['cancel'];

  constructor(
    readonly duration: number,
    readonly finished: Promise<'finished' | 'cancelled'>,
    private readonly elapsed: () => number,
    controls: Omit<MotionHandle, 'backend' | 'duration' | 'finished' | 'velocity' | 'currentTime'>,
  ) {
    this.play = controls.play;
    this.pause = controls.pause;
    this.reverse = controls.reverse;
    this.seek = controls.seek;
    this.cancel = controls.cancel;
  }

  get currentTime(): number {
    return this.elapsed();
  }
}

/** The CSS property of a camelCase name, as `getPropertyValue` reads it. */
const cssName = (name: string): string => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

let active = 0;
export const waapiProvider: MotionProvider = {
  backend: 'waapi',
  capabilities: new Set(),
  activeCount: () => active,
  animate({ target, keyframes, timing, commit = true, styles }) {
    if (styles && styles.length !== keyframes.length) throw new RangeError('styles must match keyframes');
    const animation = target.animate(keyframes.map((frame, index) => ({ ...frameToKeyframe(frame), ...styles?.[index] })), { ...timing, fill: 'both' });
    const extra = [...new Set(styles?.flatMap(frame => Object.keys(frame)))].map(cssName);
    active++;
    let settled = false;
    // Captured before the animation is cancelled, which clears its currentTime.
    let frozen: number | undefined;
    const freeze = () => { frozen ??= Number(animation.currentTime ?? 0); };
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
        freeze();
        animation.cancel();
        settle('finished');
        return;
      }
      // The end frame is written from the keyframes, not committed by the browser: WebKit's commitStyles can persist the
      // start of a delayed animation. A reversed animation ends at its first frame; a single keyframe reversed to its
      // start stands for the underlying value, so nothing is written. Omitted values stay underlying.
      const reversed = animation.playbackRate < 0;
      const endpoint = reversed ? (keyframes.length === 1 ? undefined : keyframes[0]) : keyframes[keyframes.length - 1];
      const kept = extra.map(property => [property, target.style.getPropertyValue(property), target.style.getPropertyPriority(property)] as const);
      for (const [property, value] of Object.entries(endpoint ? frameToKeyframe(endpoint) : {})) {
        target.style.setProperty(property, String(value), target.style.getPropertyPriority(property));
      }
      // The extra declarations are not persisted: their inline values, as they were before, are put back.
      for (const [property, value, priority] of kept) {
        if (value) target.style.setProperty(property, value, priority);
        else target.style.removeProperty(property);
      }
      freeze();
      animation.cancel();
      settle('finished');
    }, () => settle('cancelled'));
    return new WaapiMove(timing.duration, finished, () => frozen ?? Number(animation.currentTime ?? 0), {
      play: () => { if (!settled) animation.play(); },
      pause: () => { if (!settled) animation.pause(); },
      reverse: () => { if (!settled) animation.reverse(); },
      seek: (time) => { if (!settled) animation.currentTime = time; },
      cancel: () => { if (!settled) { freeze(); settle('cancelled'); animation.cancel(); } },
    });
  },
};
