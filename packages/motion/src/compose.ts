import type { MotionHandle, VisualFrame } from './contract.js';

const noop = (): void => undefined;

/** A handle that is already finished: no duration, no effect. */
export function settledHandle(): MotionHandle {
  return {
    backend: 'waapi',
    duration: 0,
    currentTime: 0,
    finished: Promise.resolve('finished'),
    velocity: { value: 0, source: 'unavailable' },
    play: noop,
    pause: noop,
    reverse: noop,
    seek: noop,
    cancel: noop,
  };
}

/** One handle that drives all the given handles together. */
export function composeHandles(handles: MotionHandle[]): MotionHandle {
  if (handles.length === 0) return settledHandle();
  return {
    backend: handles[0].backend,
    duration: Math.max(...handles.map(handle => handle.duration)),
    get currentTime() {
      return Math.max(...handles.map(handle => handle.currentTime));
    },
    finished: Promise.all(handles.map(handle => handle.finished)).then(
      results => (results.includes('cancelled') ? 'cancelled' : 'finished'),
    ),
    velocity: { value: 0, source: 'unavailable' },
    play: () => handles.forEach(handle => handle.play()),
    pause: () => handles.forEach(handle => handle.pause()),
    reverse: () => handles.forEach(handle => handle.reverse()),
    seek: timeMs =>
      handles.forEach(handle => handle.seek(Math.min(timeMs, handle.duration))),
    cancel: () => handles.forEach(handle => handle.cancel()),
  };
}

/**
 * A handle that exists before its animation: commands wait for the real handle, except cancel.
 * `cancelled` tells whether the handle was cancelled before its real handle arrived.
 */
export function deferredHandle(): { handle: MotionHandle; readonly cancelled: boolean; resolve(real: MotionHandle): void } {
  let real: MotionHandle | undefined;
  let cancelled = false;
  let settle!: (result: 'finished' | 'cancelled') => void;
  const finished = new Promise<'finished' | 'cancelled'>(done => {
    settle = done;
  });
  const handle: MotionHandle = {
    backend: 'waapi',
    get duration() {
      return real?.duration ?? 0;
    },
    get currentTime() {
      return real?.currentTime ?? 0;
    },
    finished,
    get velocity() {
      return real?.velocity ?? { value: 0, source: 'unavailable' };
    },
    play: () => real?.play(),
    pause: () => real?.pause(),
    reverse: () => real?.reverse(),
    seek: timeMs => real?.seek(timeMs),
    cancel() {
      if (real) real.cancel();
      else if (!cancelled) {
        cancelled = true;
        settle('cancelled');
      }
    },
  };
  return {
    handle,
    get cancelled() {
      return cancelled;
    },
    resolve(next) {
      if (cancelled) {
        next.cancel();
        return;
      }
      real = next;
      void next.finished.then(settle);
    },
  };
}

function keepFields(
  keyframes: VisualFrame[],
  keep: (field: string) => boolean,
): VisualFrame[] {
  const frames = keyframes.map(
    frame =>
      Object.fromEntries(
        Object.entries(frame).filter(([field]) => keep(field)),
      ) as VisualFrame,
  );
  return frames.some(frame => Object.keys(frame).length > 0) ? frames : [];
}

/**
 * Split keyframes into opacity-only effects and the remaining spatial fields.
 * Frames keep their index so both lists share the same offsets.
 */
export function splitFrames(keyframes: VisualFrame[]): {
  effects: VisualFrame[];
  spatial: VisualFrame[];
} {
  return {
    effects: keepFields(keyframes, field => field === 'opacity'),
    spatial: keepFields(keyframes, field => field !== 'opacity'),
  };
}
