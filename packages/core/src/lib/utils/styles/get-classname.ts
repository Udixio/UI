import { ComponentInterface } from '../component';
import { convertToKebabCase } from '../string';
import { classNames } from './classnames';

/**
 * Forces every key of `T` to be passed explicitly while still allowing
 * `undefined` as a value, so a style function can never read a silently absent
 * prop.
 *
 * The `& PropertyKey` is what makes that possible. A mapped type written
 * directly over `keyof T` is *homomorphic*, and TypeScript then treats `-?` as
 * removing `undefined` from the value type as well as removing the `?` — so
 * `T[K] | undefined` collapses back to `T[K]`. Mapping over `keyof Required<T>`
 * has exactly the same effect. Intersecting the key type breaks the
 * homomorphic link, leaving `-?` to do only what it says.
 */
type RequiredNullable<T> = {
  [K in keyof T & PropertyKey]-?: T[K] | undefined;
};

export interface StyleProps<T extends ComponentInterface> {
  /** Root classes (string), static element classes (object), or state-aware element classes (function). */
  className?: string | ElementClasses<T> | ClassNameComponent<T>;
}

/** Static classes per element, keyed by the interface's `elements` tuple. */
export type ElementClasses<T extends ComponentInterface> = Partial<
  Record<T['elements'][number], string>
>;

export type ClassNameComponent<T extends ComponentInterface> = (
  states: T['states'] & T['props'],
) => ElementClasses<T>;

export const getClassNames = <T extends ComponentInterface>(args: {
  classNameList: (
    | ClassNameComponent<T>
    | ElementClasses<T>
    | string
    | undefined
  )[];
  default: T['elements'][0];
  states: T['states'] & T['props'];
}): Record<T['elements'][number], string> => {
  const buckets: Partial<Record<T['elements'][number], string[]>> = {};
  args.classNameList.forEach((classNameComponent) => {
    if (!classNameComponent) return;
    if (typeof classNameComponent == 'string') {
      (buckets[args.default] ??= []).push(classNameComponent);
      return;
    }
    const result =
      typeof classNameComponent == 'function'
        ? classNameComponent(args.states)
        : classNameComponent;
    Object.entries(result).forEach((argsElement) => {
      const [key, value] = argsElement as [T['elements'][number], string];
      (buckets[key] ??= []).push(value);
    });
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
  defaultClassName: ClassNameComponent<T> | ElementClasses<T> | string,
) => {
  return (
    // No `& T['props']` here: intersecting the mapped type with the original
    // props re-imposes the non-optional value types, cancelling out the
    // `| undefined` that lets a caller pass a prop it has not resolved yet.
    states: RequiredNullable<T['props']> &
      T['states'] & {
        className: ClassNameComponent<T> | ElementClasses<T> | string | undefined;
      },
  ) =>
    getClassNames({
      classNameList: [states.className, defaultClassName],
      default: element,
      states,
    });
};
