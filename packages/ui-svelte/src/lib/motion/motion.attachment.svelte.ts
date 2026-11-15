import { getMotion, isPresenceVerb, motionWhenDefined, type MotionSource } from '@udixio/motion';
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { TransitionConfig } from 'svelte/transition';
import type { MotionAttachmentOptions } from './motion.types';

const sourceKey = (source: MotionSource): string =>
  typeof source === 'string' ? source : 'name' in source ? source.name : JSON.stringify(source);

/** The last source bound on an element, to tell a source change from a first mount. */
const lastKey = new WeakMap<HTMLElement, string>();

/**
 * Binds a `@udixio/motion` motion to the element it is placed on -- the Svelte
 * counterpart of the Angular directive. The binding is made once; afterwards
 * `present` and `state` are followed in place, so a change plays the matching
 * exit or entry, or replays an emphasis, without re-binding the element. The
 * animation itself lives in `@udixio/motion`: this only forwards the options.
 *
 * A motion named before it is defined waits for its definition. Server-rendered
 * content replays its entry on hydration unless `settled: true` is passed.
 *
 * ```svelte
 * {#if open}<div {@attach motion('slide')} transition:presence>…</div>{/if}
 * <button {@attach motion('press', () => ({ state: count }))}>…</button>
 * ```
 */
export function motion(
  source: MotionSource,
  options: () => MotionAttachmentOptions = () => ({}),
): Attachment<HTMLElement> {
  return (target) => {
    const key = sourceKey(source);
    const previousKey = lastKey.get(target);
    lastKey.set(target, key);
    const initial = untrack(options);
    const deferred = motionWhenDefined(target, source, {
      present: initial.present ?? true,
      settled: initial.settled ?? (previousKey !== undefined && previousKey !== key),
    });

    // Presence follows the option; only appear and disappear have a presence to set.
    $effect(() => {
      const present = options().present ?? true;
      const binding = deferred.binding;
      if (binding && isPresenceVerb(binding.verb)) void binding.setPresent(present);
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
      const binding = deferred.binding;
      if (binding?.verb === 'emphasize') binding.play();
    });

    return () => deferred.destroy();
  };
}

/**
 * Keeps a leaving element in the DOM for the time of its exit. Use it as
 * `transition:presence` only on an element of an `{#if}` or `{#each}` block
 * that must play its exit before it is removed. The transition asks the
 * element's binding for the exit and waits for the exit's duration; an element
 * without a binding, or one whose motion has no presence (an emphasis, a layout),
 * runs without a duration.
 *
 * ```svelte
 * {#if open}<div {@attach motion('slide')} transition:presence>…</div>{/if}
 * ```
 */
export function presence(
  node: Element,
): (options: { direction: 'in' | 'out' | 'both' }) => TransitionConfig {
  return ({ direction }) => {
    const binding = getMotion(node);
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
