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
  type MotionKind,
  type MotionSource,
} from '@udixio/motion';

export interface UseMotionOptions {
  /** Whether the element is present. Default: true. */
  present?: boolean;
  /** An emphasis replays each time this value changes. */
  state?: unknown;
  /** Treat the element as already in place: no entry. Default: true when hydrating server content. */
  settled?: boolean;
  /**
   * The shared identity of the element: a layout motion morphs from the place of another element that held the same key.
   * A change of it binds the element again.
   */
  shared?: string;
  /**
   * Pauses a loop while true and plays it again when false: a loop pauses by itself out of view, and this holds it for the
   * author too (WCAG 2.2.2), so a `pause: 'control'` loop needs a visible control that sets it. Ignored without a loop.
   */
  paused?: boolean;
}

export interface UseMotionReturn<T extends HTMLElement> {
  /** Put it on the animated element. */
  ref: RefCallback<T>;
  /** True while the element must be rendered: present, or still leaving. */
  mounted: boolean;
  /** Replays an emphasis. */
  play: () => void;
  /** The core binding of a kind (handle: pause, reverse, seek), once bound. Without a kind: presence, else emphasis, else layout. */
  getBinding: (kind?: MotionKind) => MotionBinding | undefined;
}

const subscribe = () => () => {};

const KINDS: readonly MotionKind[] = ['presence', 'emphasis', 'layout', 'view', 'loop'];

const sourceKey = (source: MotionSource): string =>
  typeof source === 'string'
    ? source
    : 'name' in source
      ? source.name
      : JSON.stringify(source);

const isList = (
  source: MotionSource | readonly MotionSource[],
): source is readonly MotionSource[] => Array.isArray(source);

/** The motions of a source or a list: a string is split on whitespace, and so is each string of a list. */
const motionsOf = (source: MotionSource | readonly MotionSource[]): MotionSource[] => {
  const list: readonly MotionSource[] = isList(source) ? source : [source];
  return list.flatMap((each): MotionSource[] =>
    typeof each === 'string' ? each.split(/\s+/).filter(Boolean) : [each],
  );
};

/** The binding of a kind among the deferred motions of an element; without a kind, presence, else emphasis, else layout. */
function bindingOf(motions: readonly DeferredMotion[], kind?: MotionKind): MotionBinding | undefined {
  const bindings = motions.flatMap((each) => (each.binding ? [each.binding] : []));
  for (const wanted of kind === undefined ? KINDS : [kind]) {
    const found = bindings.find((binding) => binding.kind === wanted);
    if (found) return found;
  }
  return undefined;
}

/**
 * Connects a React element to one or more named motions of `@udixio/motion`.
 *
 * The hook holds no animation logic: it binds the element through the core
 * (`motionWhenDefined`), tells the binding when `present` changes, keeps the
 * element rendered until its exit has finished, and replays an emphasis when
 * `state` changes. Several sources, a list or names separated by spaces, bind
 * each of them to the element, so one element can hold a presence and a layout.
 * Render the element while `mounted` is true and put `ref` on it.
 *
 * @example
 * ```tsx
 * function Sheet({ open }: { open: boolean }) {
 *   const panel = useMotion('slide', { present: open });
 *   return panel.mounted && <div ref={panel.ref}>…</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // A list item that enters and leaves, and moves when its neighbours change.
 * const item = useMotion(['fade', 'reflow'], { present });
 * ```
 *
 * @example
 * ```tsx
 * // A thumbnail and its detail share a key: the detail morphs out of the thumbnail.
 * const detail = useMotion('reflow', { shared: `pic-${id}` });
 * ```
 *
 * @example
 * ```tsx
 * // A spinner that turns while loading and holds still otherwise: a loop pauses by itself out of view.
 * const spinner = useMotion('rotate', { paused: !loading });
 * ```
 *
 * @devx
 * - `mounted` stays true while an exit plays, so the element is removed only
 *   once the exit has finished. Do not unmount it yourself on `present`.
 * - An emphasis replays on each change of `state`. Its `present` is not an
 *   exit: when it turns false the element is removed at once, without animation.
 *   Only `appear` and `disappear` have a presence; a layout is removed at once too.
 * - Hydrated server content is treated as already in place, so the first
 *   attach plays no entry; a later remount plays it.
 * @limitations
 * - The element must accept a `ref` that is a DOM element. A component that
 *   does not forward its ref cannot be animated.
 * - The motion is bound to the element itself, not to its children.
 */
export function useMotion<T extends HTMLElement = HTMLElement>(
  source: MotionSource | readonly MotionSource[],
  options: UseMotionOptions = {},
): UseMotionReturn<T> {
  const { present = true, state, settled, shared, paused = false } = options;

  // Hydrated content reads `true` on its first render; React then re-renders with `false`.
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const hydratedAtFirstRender = useRef(hydrated).current;
  const pastFirstCommit = useRef(false);
  const sources = motionsOf(source);
  // A change of the shared identity is a change of the binding, as a change of a source is.
  const key = JSON.stringify([sources.map(sourceKey), shared ?? null]);
  const latest = useRef({ sources, present, settled, shared, paused });
  latest.current = { sources, present, settled, shared, paused };
  const deferred = useRef<DeferredMotion[]>([]);
  const bound = useRef<{ element: HTMLElement; key: string } | null>(null);

  const [leaving, setLeaving] = useState(false);
  const [seen, setSeen] = useState(present);
  // Render-phase adjustment: keeps the element rendered in the commit where `present` turns false.
  if (seen !== present) {
    setSeen(present);
    setLeaving(!present);
  }
  const mounted = present || leaving;

  const ref = useCallback(
    (element: T | null) => {
      if (!element) return;
      const sourceChanged =
        bound.current?.element === element && bound.current.key !== key;
      const current = latest.current;
      const settledNow =
        current.settled ??
        (sourceChanged || (hydratedAtFirstRender && !pastFirstCommit.current));
      const motions = current.sources.map((each) =>
        motionWhenDefined(element, each, {
          present: current.present,
          settled: settledNow,
          shared: current.shared,
        }),
      );
      deferred.current = motions;
      bound.current = { element, key };
      // A loop bound while the author holds it starts paused.
      if (current.paused) bindingOf(motions, 'loop')?.pause();
      return () => {
        motions.forEach((motion) => motion.destroy());
        if (deferred.current === motions) deferred.current = [];
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
    const binding = bindingOf(deferred.current, 'presence');
    if (present) {
      if (binding) void binding.setPresent(true);
      return undefined;
    }
    if (!binding) {
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

  // A change of `paused` pauses or plays the loop; the value read at bind is the baseline, so a bind does not repeat it.
  const previousPaused = useRef(paused);
  useEffect(() => {
    if (Object.is(previousPaused.current, paused)) return;
    previousPaused.current = paused;
    const loop = bindingOf(deferred.current, 'loop');
    if (paused) loop?.pause();
    else loop?.play();
  }, [paused]);

  const play = useCallback(() => {
    bindingOf(deferred.current, 'emphasis')?.play();
  }, []);

  const getBinding = useCallback(
    (kind?: MotionKind) => bindingOf(deferred.current, kind),
    [],
  );

  const previousState = useRef(state);
  useEffect(() => {
    if (Object.is(previousState.current, state)) return;
    previousState.current = state;
    play();
  }, [state, play]);

  return { ref, mounted, play, getBinding };
}
