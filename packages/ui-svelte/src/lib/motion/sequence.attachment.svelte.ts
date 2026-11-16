import {
  loadSequences,
  onSequenceDefined,
  resolveSequence,
  sequencesModule,
  type SequenceBinding,
  type SequenceRef,
} from '@udixio/motion';
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { MotionSequenceAttachmentOptions } from './motion.types';

/** The last sequence bound on an element, to tell a source change from a first mount. */
const lastSource = new WeakMap<HTMLElement, string>();

/**
 * Binds a sequence to a root now, or as soon as the named sequence is defined, settled, once the sequences module is loaded:
 * until then the root is not touched, so a render never throws because of a sequence. Returns the function that destroys
 * the binding.
 */
function bindSequenceWhenDefined(
  root: HTMLElement,
  source: SequenceRef | string,
  settled: boolean,
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
 * Plays a named `@udixio/motion` sequence on the root it is placed on: its children that carry `data-motion-step` are its
 * steps. A new source on a bound element binds settled, as `motion` does.
 *
 * ```svelte
 * <section {@attach motionSequence('hero')}>…</section>
 * ```
 */
export function motionSequence(
  source: SequenceRef | string,
  options: () => MotionSequenceAttachmentOptions = () => ({}),
): Attachment<HTMLElement> {
  return (target) => {
    const key = typeof source === 'string' ? source : source.name;
    const previousKey = lastSource.get(target);
    lastSource.set(target, key);
    const settled = untrack(options).settled ?? (previousKey !== undefined && previousKey !== key);
    return bindSequenceWhenDefined(target, source, settled);
  };
}
