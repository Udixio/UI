type RequiredNullable<T> = {
  [K in keyof T]-?: any;
};

export interface StyleProps<S, E extends string> {
  className?: string | ClassNameComponent<S, E>;
}

export type ClassNameComponent<S, E extends string> = (
  states: S
) => Partial<Record<E, string>>;

export const getClassNames = <States, Elements extends string>(args: {
  classNameList: (ClassNameComponent<States, Elements> | string | undefined)[];
  default: Elements;
  states: States;
}): Record<Elements, string> => {
  let classNames: Record<Elements, string> = {} as Record<Elements, string>;
  args.classNameList.forEach((classNameComponent) => {
    if (classNameComponent) {
      if (typeof classNameComponent == 'string') {
        classNames[args.default] = classNameComponent + ' relative' + ' ';
      } else {
        const result = classNameComponent(args.states);
        Object.entries(result).map(([key, value]) => {
          if (!classNames[key as Elements]) {
            classNames[key as Elements] = key + ' ';
            if (key == args.default) {
              classNames[key as Elements] =
                (classNames[key as Elements] ?? '') + 'relative' + ' ';
            }
          }
          classNames[key as Elements] =
            (classNames[key as Elements] ?? '') + (value ?? '') + ' ';
        });
      }
    }
  });
  return classNames;
};

export const defaultClassNames = <
  States extends object,
  Elements extends string,
>(args: {
  defaultClassName: ClassNameComponent<States, Elements> | string | undefined;
  default: Elements;
}) => {
  return (
    states: RequiredNullable<States> &
      States & {
        className: ClassNameComponent<States, Elements> | string | undefined;
      }
  ) =>
    getClassNames({
      ...args,
      classNameList: [states.className, args.defaultClassName],
      states: states,
    });
};
