import {
  loadValues,
  onValueDefined,
  resolveValue,
  valuesModule,
  type ValueBinding,
  type ValueRef,
} from '@udixio/motion';
import type { Attachment } from 'svelte/attachments';
import type { MotionValueAttachmentOptions } from './motion.types';

/** The value bound to an element by `motionValue`, or undefined while the values module is not loaded. */
export function getMotionValue(target: Element, name: string): ValueBinding | undefined {
  return valuesModule()?.getValue(target, name);
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
