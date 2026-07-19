import { useRef } from 'react';
import { shallowEqual } from './shallow-equal';

export function createUseStyle<S extends object>(
  styleFn: (state: S) => Record<string, string>,
): (state: S) => Record<string, string> {
  return (state: S) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ref = useRef<{ state: S; result: Record<string, string> } | null>(
      null,
    );
    if (
      !ref.current ||
      !shallowEqual(
        ref.current.state as Record<string, unknown>,
        state as Record<string, unknown>,
      )
    ) {
      ref.current = { state, result: styleFn(state) };
    }
    return ref.current.result;
  };
}
