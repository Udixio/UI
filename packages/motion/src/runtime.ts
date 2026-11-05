import { RUNTIME_KEY } from './runtime-key.js';

/** Internal subset of the major-1 runtime. Shared registries, subscriptions,
 * motion policy and inspection are not implemented yet. */
export interface MotionRuntime {
  readonly version: string;
  retain(): void;
  release(): void;
  readonly frame: {
    read(callback: () => void): void;
    write(callback: () => void): void;
  };
}

function createRuntime(): MotionRuntime {
  let references = 0;
  let frameId: number | undefined;
  let reads: Array<() => void> = [];
  let writes: Array<() => void> = [];
  let flushing = false;
  let generation = 0;

  function schedule() {
    if (!flushing && frameId === undefined && typeof requestAnimationFrame === 'function') {
      frameId = requestAnimationFrame(flush);
    }
  }

  function flush() {
    frameId = undefined;
    flushing = true;
    const currentGeneration = generation;
    const run = (callbacks: Array<() => void>) => {
      for (const callback of callbacks) {
        if (generation !== currentGeneration) break;
        callback();
      }
    };
    try {
      const pendingReads = reads;
      reads = [];
      run(pendingReads);
      const pendingWrites = writes;
      writes = [];
      run(pendingWrites);
    } finally {
      flushing = false;
      if (reads.length || writes.length) schedule();
    }
  }

  return {
    version: '1',
    retain() { references++; },
    release() {
      if (references === 0 || --references !== 0) return;
      generation++;
      reads = [];
      writes = [];
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      frameId = undefined;
    },
    frame: {
      read(callback) { reads.push(callback); schedule(); },
      write(callback) { writes.push(callback); schedule(); },
    },
  };
}

/** The first browser copy defines the major-1 shape; SSR never stores process-global state. */
export function getMotionRuntime(): MotionRuntime {
  if (typeof window === 'undefined') return createRuntime();
  const host = globalThis as typeof globalThis & { [key: symbol]: MotionRuntime | undefined };
  return (host[RUNTIME_KEY] ??= createRuntime());
}
