import {
  getMotion,
  isPresenceVerb,
  motionWhenDefined,
  setPresentByHidden,
  type DeferredMotion,
  type MotionBinding,
  type MotionElement,
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
const lastKey = new WeakMap<MotionElement, string>();

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
 * Navigation and content (menus, tab panels, accordions) stay in the DOM, so that their
 * links and text are in the server HTML: give them `present`, and `hidden={!open}` for the
 * server render. The element is hidden once its exit has played, and shown again with its
 * entry. Transient UI (toasts, dialogs, list items) goes in an `{#if}` with
 * `transition:presence`.
 *
 * A motion named before it is defined waits for its definition. Server-rendered
 * content replays its entry on hydration unless `settled: true` is passed: the
 * server cannot run an attachment, so it does not mark the element. An element
 * already marked `data-presence="present"` is settled by the core binding.
 *
 * ```svelte
 * {#if open}<div {@attach motion('slide')} transition:presence>…</div>{/if}
 * <button {@attach motion('press', () => ({ state: count }))}>…</button>
 * {#if open}<li {@attach motion(['fade', 'reflow'])} transition:presence>…</li>{/if}
 * <ul hidden={!open} {@attach motion('fade', () => ({ present: open }))}>…</ul>
 * ```
 */
export function motion(
  source: MotionSource | readonly MotionSource[],
  options: () => MotionAttachmentOptions = () => ({}),
): Attachment<MotionElement> {
  return (target) => {
    const sources = motionsOf(source);
    const key = sources.map(sourceKey).join(' ');
    const previousKey = lastKey.get(target);
    lastKey.set(target, key);
    const initial = untrack(options);
    // A change of source binds settled; an element the server marked present is settled by the core binding.
    const deferred = sources.map((each) =>
      motionWhenDefined(target, each, {
        present: initial.present ?? true,
        settled: initial.settled ?? ((previousKey !== undefined && previousKey !== key) ? true : undefined),
        shared: initial.shared,
        restoreFocus: initial.restoreFocus,
        ...(initial.paused && { paused: true }),
      }),
    );

    // A loop bound while the author holds it starts paused.
    if (initial.paused) bindingOf(deferred, 'loop')?.pause();

    // An element absent from its first render is hidden at once: it stays in the DOM, and plays no exit.
    if (initial.present === false && !target.hasAttribute('hidden')) target.setAttribute('hidden', '');

    // Presence follows the option: each motion takes it, and one not defined yet keeps it for its definition. A change
    // follows `hidden`, as in HTML (`setPresentByHidden`): the element stays displayed while its exit plays, then `hidden`
    // hides it; the entry removes it.
    let appliedPresent: boolean | undefined;
    $effect(() => {
      const present = options().present ?? true;
      const changed = appliedPresent !== undefined && appliedPresent !== present;
      appliedPresent = present;
      untrack(() => {
        if (changed) void setPresentByHidden(target, present, deferred);
        else for (const each of deferred) void each.setPresent(present);
      });
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
      // A replay asked before the emphasis is defined plays once it is.
      for (const each of deferred) each.play();
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
 * The duration is a getter, read by Svelte when the exit starts animating, a
 * frame later: a staggered exit answers its handle only once its batch is
 * measured (a microtask of the core), so a duration read when the exit starts
 * would be 0 and the element would leave at once. Svelte also reads it once,
 * when it schedules the exit, and a 0 there leaves at once too: until the
 * handle has a duration, the getter says 1 ms.
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
      return {
        get duration() {
          return binding.handle?.duration || 1;
        },
        // Svelte keeps the node for `duration`; the no-op tick makes it time the exit itself.
        tick: () => {},
      };
    }
    void binding.setPresent(true);
    return { duration: 0 };
  };
}
