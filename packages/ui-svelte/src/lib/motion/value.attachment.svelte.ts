import type { ValueBinding, ValueRef } from '@udixio/motion';
import { onValueDefined, resolveValue, value } from '@udixio/motion/value';
import type { Attachment } from 'svelte/attachments';
import type { MotionValueAttachmentOptions } from './motion.types';

export { getValue as getMotionValue } from '@udixio/motion/value';

/**
 * Binds a value now, or as soon as the named value is defined: until then the element is not touched, so a render never
 * throws because of a value. Returns the function that destroys the binding.
 */
function bindValueWhenDefined(
  target: HTMLElement,
  source: ValueRef | string,
  onBound: (binding: ValueBinding) => void,
): () => void {
  let binding: ValueBinding | undefined;
  let stopWaiting: (() => void) | undefined;
  const bind = (ref: ValueRef | string) => {
    binding = value(target, ref);
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
    stopWaiting?.();
    stopWaiting = undefined;
    binding?.destroy();
    binding = undefined;
  };
}

/**
 * Writes a named `@udixio/motion` value on the element it is placed on, as `--udx-motion-value-<name>`, and reports each
 * new number to `onChange`. The number is read in CSS or with `getMotionValue`, so nothing re-renders for it.
 *
 * ```svelte
 * <div {@attach motionValue('tilt', () => ({ onChange: (n) => (angle = n) }))}>…</div>
 * ```
 */
export function motionValue(
  source: ValueRef | string,
  options: () => MotionValueAttachmentOptions = () => ({}),
): Attachment<HTMLElement> {
  return (target) => {
    let unsubscribe: (() => void) | undefined;
    const destroy = bindValueWhenDefined(target, source, (binding) => {
      unsubscribe = binding.subscribe((next) => options().onChange?.(next));
    });
    return () => {
      unsubscribe?.();
      destroy();
    };
  };
}
