import { ComponentInterface } from '../component';
import { classnames } from './classnames';

type RequiredNullable<T> = {
  [K in keyof T]-?: any;
};

export interface StyleProps<T extends ComponentInterface> {
  className?: string | ClassNameComponent<T>;
}

export type ClassNameComponent<T extends ComponentInterface> = (
  states: T['states'] & T['props']
) => Partial<Record<T['elements'][number], string>>;

export const getClassNames = <T extends ComponentInterface>(args: {
  classNameList: (ClassNameComponent<T> | string)[];
  default: T['elements'][0];
  states: T['states'] & T['props'];
}): Record<T['elements'][number], string> => {
  let classNames: Partial<Record<T['elements'][number], string[]>> = {};
  args.classNameList.forEach((classNameComponent) => {
    if (classNameComponent) {
      if (!classNames[args.default]) {
        classNames[args.default] = [];
      }
      if (typeof classNameComponent == 'string') {
        classNames[args.default]!.push(classNameComponent);
      } else {
        const result = classNameComponent(args.states);
        Object.entries(result).map((argsElement) => {
          const [key, value] = argsElement as [T['elements'][number], string];
          classNames[key]!.push(value);
        });
      }
    }
  });
  const result = classNames as unknown as Record<T['elements'][number], string>;

  Object.entries(classNames).map((argsElement) => {
    const [key, value] = argsElement as [T['elements'][number], string[]];

    if (key == args.default) {
      value.unshift('relative');
    }
    value.unshift(key);

    result[key] = classnames(...value);
  });

  return result;
};

export const defaultClassNames = <T extends ComponentInterface>(
  element: T['elements'][0],
  defaultClassName: ClassNameComponent<T> | string | undefined
) => {
  return (
    states: RequiredNullable<T['props']> &
      T['props'] &
      T['states'] & {
        className: ClassNameComponent<T> | string | undefined;
      }
  ) =>
    getClassNames({
      classNameList: [states.className, defaultClassName],
      default: element,
      states,
    });
};
