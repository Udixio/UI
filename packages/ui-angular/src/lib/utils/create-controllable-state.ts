import { computed, signal, type Signal } from '@angular/core';

const UNINITIALIZED = Symbol('uninitialized controllable state');

export interface CreateControllableStateOptions<T> {
  value: Signal<T | undefined>;
  defaultValue: Signal<T>;
  onChange?: (value: T) => void;
}

export interface ControllableState<T> {
  readonly value: Signal<T>;
  initialize(): void;
  set(next: T | ((current: T) => T)): void;
}

/**
 * Angular counterpart to React's useControllableState. Call initialize from
 * ngOnInit so input values have been assigned before the default is captured.
 */
export function createControllableState<T>({
  value: controlledValue,
  defaultValue,
  onChange,
}: CreateControllableStateOptions<T>): ControllableState<T> {
  const internalValue = signal<T | typeof UNINITIALIZED>(UNINITIALIZED);

  const value = computed(() => {
    const controlled = controlledValue();
    if (controlled !== undefined) {
      return controlled;
    }

    const internal = internalValue();
    return internal === UNINITIALIZED ? defaultValue() : internal;
  });

  return {
    value,
    initialize: () => {
      if (internalValue() === UNINITIALIZED) {
        internalValue.set(defaultValue());
      }
    },
    set: (next) => {
      const previousValue = value();
      const nextValue =
        typeof next === 'function'
          ? (next as (current: T) => T)(previousValue)
          : next;

      if (Object.is(previousValue, nextValue)) {
        return;
      }

      if (controlledValue() === undefined) {
        internalValue.set(nextValue);
      }
      onChange?.(nextValue);
    },
  };
}
