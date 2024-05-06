import classnames from 'classnames';

type StyleSet =
  | undefined
  | string
  | Record<string, boolean | undefined>
  | { applyWhen: Boolean; styles: StyleSet | StyleSet[] };

export interface StyleProps<S, E extends string> {
  className?: string | ClassNameComponent<S, E>;
}

export type ClassNameComponent<S, E extends string> = (
  states: S
) => Partial<Record<E, string>>;

export class StylesHelper {
  static classNames(styles?: StyleSet | StyleSet[]): string {
    if (!styles) return '';

    const compiledStyles = Array.isArray(styles)
      ? styles.flatMap((item) => this.compileStyles(item))
      : this.compileStyles(styles);

    return compiledStyles.join(' ');
  }

  static classNamesElements<S, E extends string>(args: {
    classNameList: (ClassNameComponent<S, E> | string | undefined)[];
    default: E;
    states: S;
  }): Record<E, string> {
    let classNames: Record<E, string> = {} as Record<E, string>;
    args.classNameList.forEach((classNameComponent) => {
      if (classNameComponent) {
        if (typeof classNameComponent == 'string') {
          classNames[args.default] = classNameComponent + ' relative' + ' ';
        } else {
          const result = classNameComponent(args.states);
          Object.entries(result).map(([key, value]) => {
            if (!classNames[key as E]) {
              classNames[key as E] = key + ' ';
              if (key == args.default) {
                classNames[key as E] =
                  (classNames[key as E] ?? '') + 'relative' + ' ';
              }
            }
            classNames[key as E] =
              (classNames[key as E] ?? '') + (value ?? '') + ' ';
          });
        }
      }
    });
    return classNames;
  }

  private static compileStyles(styles: StyleSet): string[] {
    if (!styles) return [];

    if (typeof styles === 'string') {
      return [styles];
    }

    if (
      'applyWhen' in styles &&
      typeof styles.styles !== 'boolean' &&
      styles.applyWhen
    ) {
      if (Array.isArray(styles.styles)) {
        return styles.styles.flatMap((style) => this.compileStyles(style));
      } else if (styles.styles !== undefined) {
        return [this.classNames(styles.styles)];
      }
    }

    return [classnames(styles)];
  }
}
