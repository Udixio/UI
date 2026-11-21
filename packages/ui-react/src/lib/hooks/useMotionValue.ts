import {
  useCallback,
  useRef,
  useSyncExternalStore,
  type RefCallback,
} from 'react';
import {
  loadValues,
  onValueDefined,
  resolveValue,
  valuesModule,
  type ValueBinding,
  type ValueRef,
} from '@udixio/motion';

/** What `useMotionValue` returns: the ref of the element, and the number it holds, read without a render. */
export interface UseMotionValueReturn<T extends HTMLElement> {
  /** Put it on the element that writes the value. */
  ref: RefCallback<T>;
  /** The number the value holds, or undefined before the element is attached. Reading it never re-renders. */
  get: () => number | undefined;
  /** Moves a state value to a number, clamped to its range. Does nothing before the element is attached. */
  set: (next: number) => void;
  /** Calls the listener with each new number, and returns its unsubscribe. A listener follows the element when it is bound again. */
  subscribe: (listener: (next: number) => void) => () => void;
}

/**
 * Binds a value now, or as soon as the named value is defined, once the values module is loaded: until then the element is
 * not touched, so a render never throws because of a value. Returns the function that destroys the binding.
 */
function bindValueWhenDefined(
  target: HTMLElement,
  source: ValueRef | string,
  onBound: (binding: ValueBinding) => void,
): () => void {
  let binding: ValueBinding | undefined;
  let stopWaiting: (() => void) | undefined;
  let cancelled = false;
  const bind = (ref: ValueRef | string) => {
    const api = valuesModule();
    if (!api) {
      // The module loads once per page; a binding released before it arrives never binds.
      void loadValues().then(
        () => {
          if (!cancelled) bind(ref);
        },
        () => {},
      );
      return;
    }
    binding = api.value(target, ref);
    onBound(binding);
  };
  if (typeof source === 'string' && !resolveValue(source)) {
    stopWaiting = onValueDefined((ref) => {
      if (ref.name !== source) return;
      stopWaiting?.();
      stopWaiting = undefined;
      bind(ref);
    });
  } else {
    bind(source);
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
 * Connects an element to a named value of `@udixio/motion`: its number is written as `--udx-motion-value-<name>`.
 *
 * Reading the value never re-renders the component: `get` returns the number at the time of the call. Use
 * `useMotionValueSnapshot` only where the number is shown.
 *
 * @example
 * ```tsx
 * // The card tilts with the pointer: its class reads `--udx-motion-value-tilt`.
 * const tilt = useMotionValue<HTMLDivElement>('tilt');
 * return <div ref={tilt.ref} className="tilt-card">…</div>;
 * ```
 */
export function useMotionValue<T extends HTMLElement = HTMLElement>(
  source: ValueRef | string,
): UseMotionValueReturn<T> {
  // A change of the name is a change of the binding: React makes a new callback, detaches the old one and attaches again.
  const key = typeof source === 'string' ? source : source.name;
  const latest = useRef(source);
  latest.current = source;
  const bound = useRef<ValueBinding | undefined>(undefined);
  // Each listener, with its unsubscribe from the binding it is on now (none while the element is not attached).
  const listeners = useRef(new Map<(next: number) => void, (() => void) | undefined>());

  const ref = useCallback(
    (element: T | null) => {
      if (!element) return;
      const destroy = bindValueWhenDefined(element, latest.current, (binding) => {
        bound.current = binding;
        for (const listener of listeners.current.keys()) {
          listeners.current.set(listener, binding.subscribe(listener));
        }
      });
      return () => {
        for (const [listener, unsubscribe] of listeners.current) {
          unsubscribe?.();
          listeners.current.set(listener, undefined);
        }
        bound.current = undefined;
        destroy();
      };
    },
    [key],
  );

  const get = useCallback(() => bound.current?.current, []);

  const set = useCallback((next: number) => {
    bound.current?.set(next);
  }, []);

  const subscribe = useCallback((listener: (next: number) => void) => {
    listeners.current.set(listener, bound.current?.subscribe(listener));
    return () => {
      listeners.current.get(listener)?.();
      listeners.current.delete(listener);
    };
  }, []);

  return { ref, get, set, subscribe };
}

/**
 * The number of a value read through `useSyncExternalStore`: the component re-renders with each new number, so use it
 * only where the number is shown.
 *
 * @example
 * ```tsx
 * const tilt = useMotionValue<HTMLDivElement>('tilt');
 * const percent = useMotionValueSnapshot(tilt);
 * return <div ref={tilt.ref}>{percent === undefined ? '' : Math.round(percent * 100)}</div>;
 * ```
 */
export function useMotionValueSnapshot(
  handle: Pick<UseMotionValueReturn<HTMLElement>, 'get' | 'subscribe'>,
): number | undefined {
  return useSyncExternalStore(handle.subscribe, handle.get, () => undefined);
}
