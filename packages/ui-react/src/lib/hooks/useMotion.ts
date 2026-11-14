import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefCallback,
} from 'react';
import {
  motionWhenDefined,
  type DeferredMotion,
  type MotionBinding,
  type MotionSource,
} from '@udixio/motion';

export interface UseMotionOptions {
  /** Whether the element is present. Default: true. */
  present?: boolean;
  /** An emphasis replays each time this value changes. */
  state?: unknown;
  /** Treat the element as already in place: no entry. Default: true when hydrating server content. */
  settled?: boolean;
}

export interface UseMotionReturn<T extends HTMLElement> {
  /** Put it on the animated element. */
  ref: RefCallback<T>;
  /** True while the element must be rendered: present, or still leaving. */
  mounted: boolean;
  /** Replays an emphasis. */
  play: () => void;
  /** The core binding (handle: pause, reverse, seek), once bound. */
  getBinding: () => MotionBinding | undefined;
}

const subscribe = () => () => {};

const sourceKey = (source: MotionSource): string =>
  typeof source === 'string'
    ? source
    : 'name' in source
      ? source.name
      : JSON.stringify(source);

/**
 * Connects a React element to a named motion of `@udixio/motion`.
 *
 * The hook holds no animation logic: it binds the element through the core
 * (`motionWhenDefined`), tells the binding when `present` changes, keeps the
 * element rendered until its exit has finished, and replays an emphasis when
 * `state` changes. Render the element while `mounted` is true and put `ref`
 * on it.
 *
 * @example
 * ```tsx
 * function Sheet({ open }: { open: boolean }) {
 *   const panel = useMotion('slide', { present: open });
 *   return panel.mounted && <div ref={panel.ref}>…</div>;
 * }
 * ```
 *
 * @devx
 * - `mounted` stays true while an exit plays, so the element is removed only
 *   once the exit has finished. Do not unmount it yourself on `present`.
 * - An emphasis replays on each change of `state`. Its `present` is not an
 *   exit: when it turns false the element is removed at once, without animation.
 * - Hydrated server content is treated as already in place, so the first
 *   attach plays no entry; a later remount plays it.
 * @limitations
 * - The element must accept a `ref` that is a DOM element. A component that
 *   does not forward its ref cannot be animated.
 * - The motion is bound to the element itself, not to its children.
 */
export function useMotion<T extends HTMLElement = HTMLElement>(
  source: MotionSource,
  options: UseMotionOptions = {},
): UseMotionReturn<T> {
  const { present = true, state, settled } = options;

  // Hydrated content reads `true` on its first render; React then re-renders with `false`.
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const hydratedAtFirstRender = useRef(hydrated).current;
  const pastFirstCommit = useRef(false);
  const latest = useRef({ source, present, settled });
  latest.current = { source, present, settled };
  const deferred = useRef<DeferredMotion | null>(null);
  const bound = useRef<{ element: HTMLElement; key: string } | null>(null);

  const [leaving, setLeaving] = useState(false);
  const [seen, setSeen] = useState(present);
  // Render-phase adjustment: keeps the element rendered in the commit where `present` turns false.
  if (seen !== present) {
    setSeen(present);
    setLeaving(!present);
  }
  const mounted = present || leaving;

  const key = sourceKey(source);

  const ref = useCallback(
    (element: T | null) => {
      if (!element) return;
      const sourceChanged =
        bound.current?.element === element && bound.current.key !== key;
      const current = latest.current;
      const settledNow =
        current.settled ??
        (sourceChanged || (hydratedAtFirstRender && !pastFirstCommit.current));
      const motion = motionWhenDefined(element, current.source, {
        present: current.present,
        settled: settledNow,
      });
      deferred.current = motion;
      bound.current = { element, key };
      return () => {
        motion.destroy();
        if (deferred.current === motion) deferred.current = null;
      };
    },
    [key, hydratedAtFirstRender],
  );

  // A microtask, not a plain assignment: StrictMode's immediate detach and re-attach of the ref
  // still belongs to the first commit.
  useEffect(() => {
    queueMicrotask(() => {
      pastFirstCommit.current = true;
    });
  }, []);

  useEffect(() => {
    const binding = deferred.current?.binding;
    if (present) {
      if (binding && binding.verb !== 'emphasize') void binding.setPresent(true);
      return undefined;
    }
    if (!binding || binding.verb === 'emphasize') {
      setLeaving(false);
      return undefined;
    }
    let current = true;
    void binding.setPresent(false).then((outcome) => {
      if (current && outcome === 'finished') setLeaving(false);
    });
    return () => {
      current = false;
    };
  }, [present]);

  const play = useCallback(() => {
    const binding = deferred.current?.binding;
    if (binding?.verb === 'emphasize') binding.play();
  }, []);

  const getBinding = useCallback(() => deferred.current?.binding, []);

  const previousState = useRef(state);
  useEffect(() => {
    if (Object.is(previousState.current, state)) return;
    previousState.current = state;
    play();
  }, [state, play]);

  return { ref, mounted, play, getBinding };
}
