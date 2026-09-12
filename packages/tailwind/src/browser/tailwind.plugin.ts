import {
  Color,
  FontPlugin,
  PluginAbstract,
  PluginImplAbstract,
} from '@udixio/theme';
import { fontCss } from '../emit/font.css';
import { stateCss } from '../emit/state.css';
import { shadowCss } from '../emit/shadow.css';

export interface TailwindPluginOptions {
  /**
   * `class`: dark mode is enabled by `darkSelector`; `media`: by
   * `prefers-color-scheme`. In both cases `darkSelector` and
   * `lightSelector` remain usable to force a subtree.
   */
  darkMode?: 'class' | 'media';
  dynamicSelector?: string;
  /** Class that forces dark mode on a subtree. @default '.dark' */
  darkSelector?: string;
  responsiveBreakPoints?: Record<string, number>;
  outFile?: string;
  /**
   * Derived themes, applied via `.theme-{name}`.
   *
   * Only the **hue** of each value is used: chroma and tone always come from
   * `sourceColor`, so that all sub-themes stay harmonized with each other.
   */
  subThemes?: Record<string, string | Color | number>;
  /**
   * Emits `--color-*: initial;` in the `@theme` block, which removes
   * Tailwind's entire default color palette to keep only the theme's.
   *
   * Pass `false` to keep the Tailwind colors (`red-500`, `slate-200`, …)
   * alongside the generated ones.
   *
   * @default true
   */
  resetColors?: boolean;
  /**
   * Force browser-compatible CSS output (pure CSS variables, no @plugin/@theme directives,
   * no filesystem writes). Set automatically by `generateThemeCss()` for SSR use cases.
   */
  ssr?: boolean;
}

function createFlexibleSelector(...classes: (string | undefined)[]): string {
  classes = classes.filter((classeName) => !!classeName);
  if (classes.length === 0) return '';
  if (classes.length === 1 && classes[0]) return classes[0];

  // Simpler approach: generate the most common cases
  const selectors: string[] = [];

  // 1. All classes on the same element
  selectors.push(classes.join(''));

  // 2. Each class as an ancestor of the others
  for (let i = 0; i < classes.length; i++) {
    const ancestor = classes[i];
    const descendants = classes.filter(
      (className, index) => index !== i && !!className,
    );

    if (descendants.length === 1) {
      selectors.push(`${ancestor} ${descendants[0]}`);
    } else if (descendants.length > 1) {
      selectors.push(`${ancestor} ${descendants.join('')}`);
      // Also the descendants separately
      for (const desc of descendants) {
        selectors.push(`${ancestor} ${desc}`);
      }
    }
  }

  // 3. Adjacent permutations (A B, B A)
  for (let i = 0; i < classes.length; i++) {
    for (let j = i + 1; j < classes.length; j++) {
      selectors.push(`${classes[i]} ${classes[j]}`);
      selectors.push(`${classes[j]} ${classes[i]}`);
    }
  }

  // Remove duplicates
  const uniqueSelectors = [...new Set(selectors)];

  return `:is(${uniqueSelectors.join(', ')})`;
}

function darkStyle({
  selectors,
  mode,
  darkSelector,
  styles,
}: {
  selectors: (string | undefined)[];
  darkSelector: string;
  styles: string;
  mode: 'class' | 'media';
}): string {
  selectors = selectors.filter((classeName) => !!classeName);

  if (mode === 'media') {
    if (selectors.length !== 0) {
      return `@media (prefers-color-scheme: dark) {
    ${createFlexibleSelector(...selectors)} {
      ${styles}
    }
  }
`;
    } else {
      return `@media (prefers-color-scheme: dark) {
    ${styles}
  }
`;
    }
  } else {
    return `${createFlexibleSelector(...selectors, darkSelector)} {
    ${styles}
  }
`;
  }
}

export class TailwindPlugin extends PluginAbstract<
  TailwindImplPluginBrowser,
  TailwindPluginOptions
> {
  public dependencies = [FontPlugin];
  public name = 'tailwind';
  pluginClass = TailwindImplPluginBrowser;
}

export class TailwindImplPluginBrowser extends PluginImplAbstract<TailwindPluginOptions> {
  public outputCss = '';

  override onInit() {
    this.options.responsiveBreakPoints ??= {
      lg: 1.125,
    };
    this.options = {
      responsiveBreakPoints: {
        lg: 1.125,
      },
      darkMode: 'class',
      darkSelector: '.dark',
      dynamicSelector: '.dynamic',
      resetColors: true,
      ...this.options,
    };
  }

  loadColor({ isDynamic }: { isDynamic: boolean }) {
    let { dynamicSelector, darkSelector } = this.options;
    if (!isDynamic) {
      dynamicSelector = undefined;
    }
    const darkMode = this.options.darkMode ?? 'class';
    if (darkMode == 'media') {
      darkSelector = undefined;
    }

    const colors = this.getColors();
    const dynamicRootSelector = dynamicSelector ?? ':root';

    if (isDynamic) {
      // Runtime values must override the build-time @theme layer, regardless
      // of the order in which the two style sheets are attached.
      this.outputCss += `
${dynamicRootSelector} {
    ${Object.entries(colors)
      .map(([key, value]) => `--color-${key}: ${value.light};`)
      .join('\n  ')}
}`;
    } else {
      const resetColors = this.options.resetColors ?? true;
      this.outputCss += `
@theme {
${resetColors ? '  --color-*: initial;\n' : ''}  ${Object.entries(colors)
        .map(([key, value]) => `--color-${key}: ${value.light};`)
        .join('\n  ')}
}`;
    }

    const darkCss = darkStyle({
      selectors: [isDynamic ? dynamicRootSelector : dynamicSelector],
      mode: darkMode,
      darkSelector: darkSelector ?? '',
      styles: Object.entries(colors)
        .map(([key, value]) => `--color-${key}: ${value.dark};`)
        .join('\n    '),
    });
    this.outputCss += isDynamic
      ? `\n${darkCss}`
      : `\n@layer theme {\n  ${darkCss}\n}`;

    const sourceColor = this.api.context.sourceColor;
    const originalRawSourceColor = this.api.context.rawSourceColor;

    for (const [key, value] of Object.entries(this.options.subThemes ?? {})) {
      const hue =
        typeof value === 'number'
          ? value
          : typeof value === 'string'
            ? Color.fromHex(value).hue
            : value.hue;

      this.api.context.sourceColor = sourceColor.withHue(hue);
      const colors = this.getColors();
      const subThemeSelector = createFlexibleSelector(
        isDynamic ? dynamicRootSelector : dynamicSelector,
        '.theme-' + key,
      );
      const subThemeStyles = Object.entries(colors)
        .map(([key, value]) => `--color-${key}: ${value.light};`)
        .join('\n    ');
      this.outputCss += isDynamic
        ? `
${subThemeSelector} {
    ${subThemeStyles}
}
`
        : `
@layer theme {
  ${subThemeSelector} {
    ${subThemeStyles}
  }
}
`;

      const subThemeDarkCss = darkStyle({
        selectors: [
          isDynamic ? dynamicRootSelector : dynamicSelector,
          '.theme-' + key,
        ],
        mode: darkMode,
        darkSelector: darkSelector ?? '',
        styles: Object.entries(colors)
          .map(([key, value]) => `--color-${key}: ${value.dark};`)
          .join('\n    '),
      });
      this.outputCss += isDynamic
        ? `\n${subThemeDarkCss}`
        : `\n@layer theme {\n  ${subThemeDarkCss}\n}`;
    }
    // Restore original sourceColor after processing subThemes
    this.api.context.update({ sourceColor: originalRawSourceColor });
  }

  getColors() {
    const colors: Record<string, { light: string; dark: string }> = {};
    const regex = /([a-z0-9]|(?=[A-Z]))([A-Z])/g;
    [false, true].forEach((isDark) => {
      this.api.context.darkMode = isDark;
      this.api.colors.getAll().forEach((value, key) => {
        const newKey = key.replace(regex, '$1-$2').toLowerCase();
        if (!colors[newKey]) {
          colors[newKey] = { light: '', dark: '' };
        }
        colors[newKey][isDark ? 'dark' : 'light'] = value.hex;
      });
    });
    return colors;
  }

  override async onLoad() {
    this.outputCss = '';
    // this.getColors();

    // if (typeof window !== 'undefined') {
    //   const { tailwindBrowserInit } = await import('./tailwind-browser');
    //
    //   this.outputCss = await tailwindBrowserInit(this.outputCss);
    // }

    this.loadColor({ isDynamic: true });
  }

  /**
   * Assembles the full static theme CSS for the build-time generated file:
   * @theme colors (registers Tailwind color utilities) + static font/state/shadow
   * utilities + @theme font families + the animation plugin. NOT used by the SSR
   * onLoad path, which stays colors-only under `.dynamic`.
   */
  emitStaticCss() {
    this.outputCss = '';
    this.loadColor({ isDynamic: false }); // @theme { --color-* } + dark @layer + subThemes
    const colorKeys = Object.keys(this.getColors()); // kebab keys
    const { fontStyles, fontFamily } = this.api.plugins
      .getPlugin(FontPlugin)
      .getInstance()
      .getFonts();

    this.outputCss += '\n' + shadowCss();
    this.outputCss += '\n' + stateCss(colorKeys);
    this.outputCss +=
      '\n' +
      fontCss({
        fontStyles,
        responsiveBreakPoints: this.options.responsiveBreakPoints ?? {
          lg: 1.125,
        },
        fontFamily,
      });
    this.outputCss += `\n@theme {\n  ${Object.entries(fontFamily)
      .map(
        ([key, values]) =>
          `--font-${key}: ${(values as string[])
            .map((v) => (v.trim().startsWith('var(') ? v : `"${v}"`))
            .join(', ')};`,
      )
      .join('\n  ')}\n}`;
    this.outputCss += '\n@plugin "@udixio/tailwind";';
  }
}
