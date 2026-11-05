import { animate, cubicBezier } from 'animejs';
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
  capabilities: new Set(),
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
    const coordinates = bezier?.[1].split(',').map((value) => Number(value.trim()));
    const ease = coordinates?.length === 4 && coordinates.every(Number.isFinite)
      && coordinates[0] >= 0 && coordinates[0] <= 1 && coordinates[2] >= 0 && coordinates[2] <= 1
      ? cubicBezier(coordinates[0], coordinates[1], coordinates[2], coordinates[3]) : 'linear';
    const computed = getComputedStyle(target);
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
        autoplay: true, onComplete: () => settle('finished'),
      });
    } catch (error) {
      active--;
      throw error;
    }
    return {
      backend: 'animejs', duration: timing.duration, finished,
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
