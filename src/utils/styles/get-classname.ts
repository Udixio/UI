import { Component } from '../component';
import { classnames } from './classnames';

type RequiredNullable<T> = {
  [K in keyof T]-?: any;
};

export interface StyleProps<T extends Component<any>> {
  className?: string | ClassNameComponent<T>;
}

export type ClassNameComponent<T extends Component<any>> = (
  states: StatesFromComponent<T>
) => Partial<Record<T['elements'], string>>;

export const getClassNames = <T extends Component<any>>(args: {
  classNameList: (ClassNameComponent<T> | string | undefined)[];
  default: T['elements'][0];
  states: T['states'];
}): Record<T['elements'][number], string> => {
  let classNames: Partial<Record<T['elements'][number], string>> = {};
  args.classNameList.forEach((classNameComponent) => {
    if (classNameComponent) {
      if (!classNames[args.default]) {
        classNames[args.default] = 'relative';
      }
      if (typeof classNameComponent == 'string') {
        classNames[args.default] = classnames(
          classNames[args.default],
          classNameComponent
        );
      } else {
        const result = classNameComponent(args.states);
        Object.entries(result).map((argsElement) => {
          const [key, value] = argsElement as [T['elements'], string];
          if (!classNames[key]?.startsWith(key)) {
            classNames[key] = classnames(key, classNames[key]);
          }
          classNames[key] = classnames(classNames[key], value);
        });
      }
    }
  });
  return classNames as Record<T['elements'][number], string>;
};

type StatesFromComponent<T extends Component<any>> = T['props'] &
  RequiredNullable<T['defaultProps']> &
  T['states'];

export const defaultClassNames = <T extends Component<any>>(args: {
  defaultClassName: ClassNameComponent<T> | string | undefined;
  default: T['elements'][0];
}) => {
  return (
    states: StatesFromComponent<T> & {
      className: ClassNameComponent<T> | string | undefined;
    }
  ) =>
    getClassNames({
      ...args,
      classNameList: [states.className, args.defaultClassName],
      states: states,
    });
};
