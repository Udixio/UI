import {
  getMotion,
  isPresenceVerb,
  motionWhenDefined,
  type DeferredMotion,
  type MotionBinding,
  type MotionKind,
  type MotionSource,
} from '@udixio/motion';
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { TransitionConfig } from 'svelte/transition';
import type { MotionAttachmentOptions } from './motion.types';

const sourceKey = (source: MotionSource): string =>
  typeof source === 'string' ? source : 'name' in source ? source.name : JSON.stringify(source);

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

/** The binding of a kind among the deferred motions of an element. */
const bindingOf = (deferred: readonly DeferredMotion[], kind: MotionKind): MotionBinding | undefined =>
  deferred.map((each) => each.binding).find((binding) => binding?.kind === kind);

/** The last source bound on an element, to tell a source change from a first mount. */
const lastKey = new WeakMap<HTMLElement, string>();

/**
 * Binds a `@udixio/motion` motion to the element it is placed on -- the Svelte
 * counterpart of the Angular directive. The binding is made once; afterwards
 * `present` and `state` are followed in place, so a change plays the matching
 * exit or entry, or replays an emphasis, without re-binding the element. The
 * animation itself lives in `@udixio/motion`: this only forwards the options.
 *
 * A list of sources, or names separated by spaces, binds each of them to the element:
 * one element can hold a presence and a layout at once.
 *
 * A motion named before it is defined waits for its definition. Server-rendered
 * content replays its entry on hydration unless `settled: true` is passed.
 *
 * ```svelte
 * {#if open}<div {@attach motion('slide')} transition:presence>…</div>{/if}
 * <button {@attach motion('press', () => ({ state: count }))}>…</button>
 * {#if open}<li {@attach motion(['fade', 'reflow'])} transition:presence>…</li>{/if}
 * ```
 */
export function motion(
  source: MotionSource | readonly MotionSource[],
  options: () => MotionAttachmentOptions = () => ({}),
): Attachment<HTMLElement> {
  return (target) => {
    const sources = motionsOf(source);
    const key = sources.map(sourceKey).join(' ');
    const previousKey = lastKey.get(target);
    lastKey.set(target, key);
    const initial = untrack(options);
    const deferred = sources.map((each) =>
      motionWhenDefined(target, each, {
        present: initial.present ?? true,
        settled: initial.settled ?? (previousKey !== undefined && previousKey !== key),
        shared: initial.shared,
      }),
    );

    // A loop bound while the author holds it starts paused.
    if (initial.paused) bindingOf(deferred, 'loop')?.pause();

    // Presence follows the option; only appear and disappear have a presence to set.
    $effect(() => {
      const present = options().present ?? true;
      const binding = bindingOf(deferred, 'presence');
      if (binding) void binding.setPresent(present);
    });

    // A change of `paused` pauses or plays the loop; the value read at bind is the baseline, so a bind does not repeat it.
    let pausedApplied = initial.paused ?? false;
    $effect(() => {
      const paused = options().paused ?? false;
      if (paused === pausedApplied) return;
      pausedApplied = paused;
      const loop = bindingOf(deferred, 'loop');
      if (paused) loop?.pause();
      else loop?.play();
    });

    // An emphasis replays on a real change of `state`, never at the first read.
    let first = true;
    let previous: unknown;
    $effect(() => {
      const state = options().state;
      if (first) {
        first = false;
        previous = state;
        return;
      }
      if (Object.is(previous, state)) return;
      previous = state;
      bindingOf(deferred, 'emphasis')?.play();
    });

    return () => deferred.forEach((each) => each.destroy());
  };
}

/**
 * Keeps a leaving element in the DOM for the time of its exit. Use it as
 * `transition:presence` only on an element of an `{#if}` or `{#each}` block
 * that must play its exit before it is removed. The transition asks the
 * element's presence binding for the exit and waits for the exit's duration; an
 * element without a presence binding (none, or only an emphasis or a layout)
 * runs without a duration.
 *
 * ```svelte
 * {#if open}<div {@attach motion('slide')} transition:presence>…</div>{/if}
 * {#if open}<li {@attach motion(['fade', 'reflow'])} transition:presence>…</li>{/if}
 * ```
 */
export function presence(
  node: Element,
): (options: { direction: 'in' | 'out' | 'both' }) => TransitionConfig {
  return ({ direction }) => {
    const binding = getMotion(node, 'presence');
    if (!binding || !isPresenceVerb(binding.verb)) return { duration: 0 };
    if (direction === 'out') {
      void binding.setPresent(false);
      // Svelte keeps the node for `duration`; the no-op tick makes it time the exit itself.
      return { duration: binding.handle?.duration ?? 0, tick: () => {} };
    }
    void binding.setPresent(true);
    return { duration: 0 };
  };
}
