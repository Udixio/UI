import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type RefCallback,
} from 'react';
import {
  loadSequences,
  onSequenceDefined,
  resolveSequence,
  sequencesModule,
  type MotionHandle,
  type SequenceBinding,
  type SequenceRef,
} from '@udixio/motion';

export interface UseMotionSequenceOptions {
  /** Treat the content as already in place: no entry. Default: true when hydrating server content, else false. */
  settled?: boolean;
}

export interface UseMotionSequenceReturn<T extends HTMLElement> {
  /** Put it on the root of the sequence: the children that carry `data-motion-step` are its steps. */
  ref: RefCallback<T>;
  /** Replays the sequence from its start. */
  play: () => void;
  /** The handle of the latest play, or null before the first one. */
  getHandle: () => MotionHandle | null;
}

const subscribe = () => () => {};

/**
 * Binds a sequence to a root now, or as soon as the named sequence is defined, settled, once the sequences module is loaded:
 * until then the root is not touched, so a render never throws because of a sequence. Returns the function that destroys
 * the binding.
 */
function bindSequenceWhenDefined(
  root: HTMLElement,
  source: SequenceRef | string,
  settled: boolean,
  onBound: (binding: SequenceBinding) => void,
): () => void {
  let binding: SequenceBinding | undefined;
  let stopWaiting: (() => void) | undefined;
  let cancelled = false;
  const bind = (ref: SequenceRef | string, asSettled: boolean) => {
    const api = sequencesModule();
    if (!api) {
      // The module loads once per page; a binding released before it arrives never binds.
      void loadSequences().then(
        () => {
          if (!cancelled) bind(ref, asSettled);
        },
        () => {},
      );
      return;
    }
    binding = api.sequence(root, ref, { settled: asSettled });
    onBound(binding);
  };
  if (typeof source === 'string' && !resolveSequence(source)) {
    stopWaiting = onSequenceDefined((ref) => {
      if (ref.name !== source) return;
      stopWaiting?.();
      stopWaiting = undefined;
      bind(ref, true);
    });
  } else {
    bind(source, settled);
  }
  return () => {
    cancelled = true;
    stopWaiting?.();
    stopWaiting = undefined;
    binding?.destroy();
    binding = undefined;
  };
}

/**
 * Connects an element to a named sequence of `@udixio/motion`: one handle plays the choreography of its children.
 *
 * @example
 * ```tsx
 * // A hero whose title, subtitle and actions enter one after the other.
 * const hero = useMotionSequence<HTMLElement>('hero');
 * return <section ref={hero.ref}>…</section>;
 * ```
 *
 * @devx
 * - A sequence bound on a client mount plays its entry at once. Hydrated server content is treated as in place, so
 *   the first attach plays nothing; a later remount plays it.
 * - A change of `source` binds the new sequence settled, as `useMotion` does: call `play` to replay it.
 */
export function useMotionSequence<T extends HTMLElement = HTMLElement>(
  source: SequenceRef | string,
  options: UseMotionSequenceOptions = {},
): UseMotionSequenceReturn<T> {
  // Hydrated content reads `true` on its first render; React then re-renders with `false`.
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const hydratedAtFirstRender = useRef(hydrated).current;
  const pastFirstCommit = useRef(false);
  const key = typeof source === 'string' ? source : source.name;
  const latest = useRef({ source, settled: options.settled });
  latest.current = { source, settled: options.settled };
  const bound = useRef<{ element: HTMLElement; key: string } | null>(null);
  const current = useRef<SequenceBinding | undefined>(undefined);

  const ref = useCallback(
    (element: T | null) => {
      if (!element) return;
      const sourceChanged = bound.current?.element === element && bound.current.key !== key;
      const { source: next, settled } = latest.current;
      const settledNow = settled ?? (sourceChanged || (hydratedAtFirstRender && !pastFirstCommit.current));
      const destroy = bindSequenceWhenDefined(element, next, settledNow, (binding) => {
        current.current = binding;
      });
      bound.current = { element, key };
      return () => {
        destroy();
        current.current = undefined;
      };
    },
    [key, hydratedAtFirstRender],
  );

  // A microtask, not a plain assignment: StrictMode's immediate detach and re-attach of the ref still belongs to the first commit.
  useEffect(() => {
    queueMicrotask(() => {
      pastFirstCommit.current = true;
    });
  }, []);

  const play = useCallback(() => {
    current.current?.play();
  }, []);

  const getHandle = useCallback(() => current.current?.handle ?? null, []);

  return { ref, play, getHandle };
}
