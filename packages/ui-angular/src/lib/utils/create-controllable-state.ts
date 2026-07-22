import { computed, signal, type Signal } from '@angular/core';

const UNINITIALIZED = Symbol('uninitialized controllable state');

export interface CreateControllableStateOptions<T> {
  value: Signal<T | undefined>;
  defaultValue: Signal<T>;
  onChange?: (value: T) => void;
  componentName?: string;
  stateName?: string;
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
  componentName = 'Component',
  stateName = 'value',
}: CreateControllableStateOptions<T>): ControllableState<T> {
  const internalValue = signal<T | typeof UNINITIALIZED>(UNINITIALIZED);
  let initialControlled: boolean | undefined;
  let warnedAboutModeChange = false;

  const checkMode = (isControlled: boolean): void => {
    if (
      initialControlled === undefined ||
      initialControlled === isControlled ||
      warnedAboutModeChange
    ) {
      return;
    }

    warnedAboutModeChange = true;
    console.error(
      `Udixio UI: <${componentName}> changed ${stateName} from ${
        initialControlled ? 'controlled' : 'uncontrolled'
      } to ${isControlled ? 'controlled' : 'uncontrolled'}. Choose one mode for the component lifetime.`,
    );
  };

  const value = computed(() => {
    const controlled = controlledValue();
    checkMode(controlled !== undefined);
    if (controlled !== undefined) {
      return controlled;
    }

    const internal = internalValue();
    return internal === UNINITIALIZED ? defaultValue() : internal;
  });

  return {
    value,
    initialize: () => {
      initialControlled ??= controlledValue() !== undefined;
      if (internalValue() === UNINITIALIZED) {
        internalValue.set(defaultValue());
      }
    },
    set: (next) => {
      checkMode(controlledValue() !== undefined);
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
