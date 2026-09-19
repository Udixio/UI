const UNINITIALIZED = Symbol('uninitialized controllable state');

export interface ControllableStateOptions<T> {
  /** Reads the controlled prop; `undefined` selects uncontrolled mode. */
  value: () => T | undefined;
  /** Read once, when the state is created in uncontrolled mode. */
  defaultValue: () => T;
  onChange?: (value: T) => void;
  /**
   * Writes an accepted value back to the `$bindable` prop in controlled mode,
   * so `bind:` owners follow and function-binding owners decide.
   */
  assign?: (value: T) => void;
  componentName?: string;
  stateName?: string;
}

export interface ControllableState<T> {
  readonly current: T;
  set(next: T | ((current: T) => T)): void;
}

/**
 * Svelte counterpart to React's useControllableState and Angular's
 * createControllableState. Create it once in the component script, after
 * `$props()`, so the initial mode is read from the real props.
 */
export function createControllableState<T>({
  value: controlledValue,
  defaultValue,
  onChange,
  assign,
  componentName = 'Component',
  stateName = 'value',
}: ControllableStateOptions<T>): ControllableState<T> {
  const initialControlled = controlledValue() !== undefined;
  let internal = $state<T | typeof UNINITIALIZED>(
    initialControlled ? UNINITIALIZED : defaultValue(),
  );
  let warnedAboutModeChange = false;

  const checkMode = (isControlled: boolean): void => {
    if (initialControlled === isControlled || warnedAboutModeChange) {
      return;
    }

    warnedAboutModeChange = true;
    console.error(
      `Udixio UI: <${componentName}> changed ${stateName} from ${
        initialControlled ? 'controlled' : 'uncontrolled'
      } to ${isControlled ? 'controlled' : 'uncontrolled'}. Choose one mode for the component lifetime.`,
    );
  };

  const current = $derived.by(() => {
    const controlled = controlledValue();
    checkMode(controlled !== undefined);
    if (controlled !== undefined) {
      return controlled;
    }
    return internal === UNINITIALIZED ? defaultValue() : (internal as T);
  });

  return {
    get current() {
      return current;
    },
    set(next) {
      const isControlled = controlledValue() !== undefined;
      checkMode(isControlled);
      const previousValue = current;
      const nextValue =
        typeof next === 'function'
          ? (next as (current: T) => T)(previousValue)
          : next;

      if (Object.is(previousValue, nextValue)) {
        return;
      }

      if (isControlled) {
        assign?.(nextValue);
      } else {
        internal = nextValue;
      }
      onChange?.(nextValue);
    },
  };
}
