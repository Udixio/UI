import { useMemo } from 'react';

export function createUseStyle<TState>(
  styleFn: (state: TState) => Record<string, string>,
): (state: TState) => Record<string, string> {
  return (state: TState) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMemo(() => styleFn(state), [state]);
}
