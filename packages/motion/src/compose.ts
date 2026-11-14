import type { MotionHandle, VisualFrame } from './contract.js';

const noop = (): void => undefined;

/** A handle that is already finished: no duration, no effect. */
export function settledHandle(): MotionHandle {
  return {
    backend: 'waapi',
    duration: 0,
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
