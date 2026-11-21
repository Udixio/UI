import {
  Children,
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  PresenceChildContext,
  PresenceRegistryContext,
  type PresenceRegistryValue,
} from './presence-context';

/** The props of `Presence`. */
export interface PresenceProps {
  /** The children: each `Motion` has a key, or one conditional child, `{open && <Motion key="panel" … />}`. */
  children?: ReactNode;
}

/** A child as it is rendered: the element it was last given, and whether it has left. */
interface Entry {
  readonly key: string;
  readonly element: ReactElement;
  readonly leaving: boolean;
}

interface PresenceState {
  /** The children of the last render: a render that gives other children is merged in. */
  readonly children: ReactNode;
  readonly entries: readonly Entry[];
}

type PresenceAction =
  | {
      readonly type: 'children';
      readonly children: ReactNode;
      readonly elements: readonly ReactElement[];
    }
  | { readonly type: 'gone'; readonly key: string };

/** The motions of each child, and whether each has reported its exit played. */
type Slots = Map<string, Set<{ exited: boolean }>>;

const isDevelopment = () =>
  typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

/**
 * The children as elements, each with a key. A child with no key is keyed by its position, and development says so: the key
 * is how the Presence knows which child left.
 */
function keyedElements(children: ReactNode): ReactElement[] {
  const elements: ReactElement[] = [];
  Children.forEach(children, (child, index) => {
    if (!isValidElement(child)) return;
    if (child.key !== null) {
      elements.push(child);
      return;
    }
    if (isDevelopment()) {
      console.error(
        'Udixio UI: <Presence> needs a key on each child, so that it knows which child has left. Give the child a `key`.',
      );
    }
    elements.push(cloneElement(child, { key: `#${index}` }));
  });
  return elements;
}

const keyOf = (element: ReactElement): string => element.key ?? '';

/**
 * The children as they are rendered. The current children come in their order. A child that left keeps its place: it is
 * rendered after the nearest child before it that is still rendered, or first when there is none.
 */
function mergeEntries(
  previous: readonly Entry[],
  current: readonly ReactElement[],
): Entry[] {
  const merged: Entry[] = current.map((element) => ({
    key: keyOf(element),
    element,
    leaving: false,
  }));
  const stillThere = new Set(merged.map((entry) => entry.key));
  previous.forEach((entry, index) => {
    if (stillThere.has(entry.key)) return;
    let at = 0;
    for (let before = index - 1; before >= 0; before--) {
      const found = merged.findIndex(
        (each) => each.key === previous[before].key,
      );
      if (found !== -1) {
        at = found + 1;
        break;
      }
    }
    merged.splice(at, 0, { ...entry, leaving: true });
  });
  return merged;
}

function reducePresence(
  state: PresenceState,
  action: PresenceAction,
): PresenceState {
  if (action.type === 'gone') {
    return state.entries.some((entry) => entry.key === action.key && entry.leaving)
      ? {
          ...state,
          entries: state.entries.filter((entry) => entry.key !== action.key),
        }
      : state;
  }
  if (action.children === state.children) return state;
  return {
    children: action.children,
    entries: mergeEntries(state.entries, action.elements),
  };
}

/**
 * Removes a child that left once every motion it holds has played its exit. A child with no motion in it has no exit to
 * wait for, so it goes at once.
 */
function settle(
  slots: Slots,
  dispatch: Dispatch<PresenceAction>,
  key: string,
): void {
  const held = slots.get(key);
  if (!held || [...held].every((slot) => slot.exited)) {
    dispatch({ type: 'gone', key });
  }
}

function registryOf(
  slots: Slots,
  dispatch: Dispatch<PresenceAction>,
): PresenceRegistryValue {
  return {
    attach(key) {
      const held = slots.get(key) ?? new Set<{ exited: boolean }>();
      slots.set(key, held);
      const slot = { exited: false };
      held.add(slot);
      return {
        report(exited) {
          slot.exited = exited;
          if (exited) settle(slots, dispatch, key);
        },
        detach() {
          held.delete(slot);
          if (held.size === 0 && slots.get(key) === held) slots.delete(key);
          settle(slots, dispatch, key);
        },
      };
    },
  };
}

/**
 * Keeps the children that leave it rendered until their exit has played, so that a removed `Motion` plays its exit before it
 * leaves the page. It renders no element of its own: the children are the elements of the parent.
 *
 * A `Motion` inside a child is given the presence of the child: a child in the children is present and enters, and a child
 * that left is kept and exits. Once every motion of a child has finished its exit, the child is removed. A child that holds no
 * motion leaves at once. A child added in a render enters in that render, with the others added with it.
 *
 * @example
 * ```tsx
 * <ul>
 *   <Presence>
 *     {items.map((item) => (
 *       <Motion key={item.id} as="li" name="inbox reflow">{item.text}</Motion>
 *     ))}
 *   </Presence>
 * </ul>
 * ```
 *
 * @example
 * ```tsx
 * // A single conditional child: it enters when it appears, and leaves once its exit has played.
 * <Presence>{open && <Motion key="panel" name="slide">…</Motion>}</Presence>
 * ```
 *
 * @devx
 * - Give each child a `key`: it is how the Presence knows which child left. A child without one is kept by its position, and
 *   development reports it.
 * - A child that left keeps the props it had when it left, so its content plays its exit as it was.
 * - A child keeps its place while it leaves: after the child before it that is still rendered, or first when there is none.
 * - Children of a Presence are removed in the order their exits end. A child that comes back before its exit has played is
 *   kept, and its exit is cancelled.
 * @limitations
 * - The exits exist in the browser only: a server render shows the current children.
 * - Only a `Motion` reports its exit to the Presence. A child whose motion is run by a `useMotion` hook instead leaves at once,
 *   without its exit.
 */
export function Presence({ children }: PresenceProps): ReactNode {
  const [state, dispatch] = useReducer(
    reducePresence,
    children,
    (initial): PresenceState => ({
      children: initial,
      entries: keyedElements(initial).map((element) => ({
        key: keyOf(element),
        element,
        leaving: false,
      })),
    }),
  );
  // A render that gives other children merges them in. The state is updated during the render, so the children it renders are
  // the merged ones.
  if (state.children !== children) {
    dispatch({
      type: 'children',
      children,
      elements: keyedElements(children),
    });
  }

  const [slots] = useState<Slots>(() => new Map());
  const [registry] = useState<PresenceRegistryValue>(() =>
    registryOf(slots, dispatch),
  );

  // A child that left with no motion in it, or whose motions have all ended their exits, goes now.
  useLayoutEffect(() => {
    for (const entry of state.entries) {
      if (entry.leaving) settle(slots, dispatch, entry.key);
    }
  }, [slots, state.entries]);

  return (
    <PresenceRegistryContext.Provider value={registry}>
      {state.entries.map((entry) => (
        <PresenceChildContext.Provider
          key={entry.key}
          value={{ key: entry.key, present: !entry.leaving }}
        >
          {entry.element}
        </PresenceChildContext.Provider>
      ))}
    </PresenceRegistryContext.Provider>
  );
}
