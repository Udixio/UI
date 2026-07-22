import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from 'react';

export interface UseControllableStateOptions<T> {
  value: T | undefined;
  defaultValue: T;
  onChange?: (value: T) => void;
  componentName: string;
  stateName: string;
}

/**
 * Implements the same strict controlled/uncontrolled contract used by the
 * Angular adapter. `undefined` selects uncontrolled mode for the lifetime of
 * the component.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  componentName,
  stateName,
}: UseControllableStateOptions<T>): readonly [
  T,
  (next: SetStateAction<T>) => void,
] {
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const currentValue = isControlled ? value : uncontrolledValue;

  const initialModeRef = useRef(isControlled);
  const controlledRef = useRef(isControlled);
  const currentValueRef = useRef(currentValue);
  const onChangeRef = useRef(onChange);

  controlledRef.current = isControlled;
  currentValueRef.current = currentValue;
  onChangeRef.current = onChange;

  useEffect(() => {
    if (initialModeRef.current !== isControlled) {
      console.error(
        `Udixio UI: <${componentName}> changed ${stateName} from ${
          initialModeRef.current ? 'controlled' : 'uncontrolled'
        } to ${isControlled ? 'controlled' : 'uncontrolled'}. Choose one mode for the component lifetime.`,
      );
    }
  }, [componentName, isControlled, stateName]);

  const setValue = useCallback((next: SetStateAction<T>) => {
    const previousValue = currentValueRef.current;
    const nextValue =
      typeof next === 'function'
        ? (next as (previous: T) => T)(previousValue)
        : next;

    if (Object.is(previousValue, nextValue)) {
      return;
    }

    if (!controlledRef.current) {
      currentValueRef.current = nextValue;
      setUncontrolledValue(nextValue);
    }

    onChangeRef.current?.(nextValue);
  }, []);

  return [currentValue, setValue] as const;
}
