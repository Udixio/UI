import { useMemo } from 'react';
import { ComponentInterface } from '../component';
import { ClassNameComponent, getClassNames } from './get-classname';

export function useClassNames<T extends ComponentInterface>(
  element: T['elements'][0],
  defaultClassName: ClassNameComponent<T> | string,
  states: (T['states'] & T['props']) & { className?: string | ClassNameComponent<T> },
): Record<T['elements'][number], string> {
  return useMemo(
    () =>
      getClassNames<T>({
        classNameList: [states?.className, defaultClassName],
        default: element,
        states: states as any,
      }),
    [element, defaultClassName, states],
  );
}

// Documentation note:
// - This hook centralizes class name merging logic (string or function),
//   prefixes each element key with its kebab-case name, and adds `relative` on the root element by default.
// - It preserves current order/priority where consumer overrides take precedence over defaults.
// - Pass overrides via props.className (string or function) — see Button for example usage.
