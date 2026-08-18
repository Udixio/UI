import { ComponentInterface } from '../component';
import { convertToKebabCase } from '../string';
import { classNames } from './classnames';

/**
 * Forces every key of `T` to be passed explicitly while still allowing
 * `undefined` as a value, so a style function can never read a silently absent
 * prop. Mapping over `keyof Required<T>` rather than using the `-?` modifier is
 * deliberate: `-?` strips `undefined` from the value type, even when the union
 * spells it out.
 */
type RequiredNullable<T> = {
  [K in keyof Required<T>]: T[K] | undefined;
};

export interface StyleProps<T extends ComponentInterface> {
  /** Classes or state-aware element classes applied through the shared style contract. */
  className?: string | ClassNameComponent<T>;
}

export type ClassNameComponent<T extends ComponentInterface> = (
  states: T['states'] & T['props'],
) => Partial<Record<T['elements'][number], string>>;

export const getClassNames = <T extends ComponentInterface>(args: {
  classNameList: (ClassNameComponent<T> | string | undefined)[];
  default: T['elements'][0];
  states: T['states'] & T['props'];
}): Record<T['elements'][number], string> => {
  const buckets: Partial<Record<T['elements'][number], string[]>> = {};
  args.classNameList.forEach((classNameComponent) => {
    if (classNameComponent) {
      if (typeof classNameComponent == 'string') {
        (buckets[args.default] ??= []).push(classNameComponent);
      } else {
        const result = classNameComponent(args.states);
        Object.entries(result).map((argsElement) => {
          const [key, value] = argsElement as [T['elements'][number], string];
          (buckets[key] ??= []).push(value);
        });
      }
    }
  });

  const result = buckets as unknown as Record<T['elements'][number], string>;

  Object.entries(buckets).map((argsElement) => {
    // eslint-disable-next-line prefer-const
    let [key, value] = argsElement as [T['elements'][number], string[]];

    value = value.reverse();

    if (key == args.default) {
      value.unshift('relative');
    }

    value.unshift(convertToKebabCase(key));

    result[key] = classNames(...value);
  });

  return result;
};

export const defaultClassNames = <T extends ComponentInterface>(
  element: T['elements'][0],
  defaultClassName: ClassNameComponent<T> | string,
) => {
  return (
    states: RequiredNullable<T['props']> &
      T['props'] &
      T['states'] & {
        className: ClassNameComponent<T> | string | undefined;
      },
  ) =>
    getClassNames({
      classNameList: [states.className, defaultClassName],
      default: element,
      states,
    });
};
