import classnames from 'classnames';

type StyleSet =
  | undefined
  | string
  | Record<string, boolean | undefined>
  | { applyWhen: Boolean; styles: StyleSet | StyleSet[] };

export class StylingHelper {
  static classNames(styles?: StyleSet | StyleSet[]): string {
    if (!styles) return '';

    const compiledStyles = Array.isArray(styles)
      ? styles.flatMap((item) => this.compileStyles(item))
      : this.compileStyles(styles);

    return compiledStyles.join(' ');
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
