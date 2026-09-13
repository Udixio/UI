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
  /**
   * Class that forces light mode on a subtree, including under
   * `darkSelector`. Nesting is unlimited (`dark → light → dark → …`): each
   * boundary re-reads the nearest inherited toggle.
   *
   * Pass `false` to not emit it.
   *
   * @default '.light'
   */
  lightSelector?: string | false;
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

/**
 * Mode switching is a "space toggle": `--udx-on-dark` is either empty (valid,
 * dark) or `initial` (invalid, light). Every colour is resolved through it:
 *
 *   --udx-x-dark-on: var(--udx-on-dark) var(--udx-dark-x);   →  " #hex" or invalid
 *   --color-x:       var(--udx-x-dark-on, var(--udx-light-x));
 *
 * The palette is written once per theme, `.dark`/`.light` are one line each,
 * and the aliases are re-resolved on every boundary element, so the nearest
 * ancestor wins at any nesting depth.
 */
const TOGGLE = '--udx-on-dark';

function paletteStyles(colors: Record<string, { light: string; dark: string }>) {
  return Object.entries(colors)
    .flatMap(([key, value]) => [
      `--udx-light-${key}: ${value.light};`,
      `--udx-dark-${key}: ${value.dark};`,
    ])
    .join('\n    ');
}

function aliasStyles(keys: string[]) {
  return keys
    .flatMap((key) => [
      `--udx-${key}-dark-on: var(${TOGGLE}) var(--udx-dark-${key});`,
      `--color-${key}: var(--udx-${key}-dark-on, var(--udx-light-${key}));`,
    ])
    .join('\n    ');
}

function block(selector: string, styles: string) {
  return `${selector} {\n    ${styles}\n  }\n`;
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
      lightSelector: '.light',
      dynamicSelector: '.dynamic',
      resetColors: true,
      ...this.options,
    };
  }

  loadColor({ isDynamic }: { isDynamic: boolean }) {
    let { dynamicSelector } = this.options;
    const { lightSelector } = this.options;
    const darkSelector = this.options.darkSelector ?? '';
    if (!isDynamic) {
      dynamicSelector = undefined;
    }
    const darkMode = this.options.darkMode ?? 'class';

    const colors = this.getColors();
    const keys = Object.keys(colors);
    const dynamicRootSelector = dynamicSelector ?? ':root';
    const rootSelector = isDynamic ? dynamicRootSelector : ':root';
    // Runtime values must override the build-time @theme layer, regardless
    // of the order in which the two style sheets are attached: the dynamic
    // output stays out of `@layer theme`.
    const emit = (css: string) => {
      this.outputCss += isDynamic ? `\n${css}` : `\n@layer theme {\n  ${css}}`;
    };

    if (!isDynamic) {
      const resetColors = this.options.resetColors ?? true;
      this.outputCss += `
@theme {
${resetColors ? '  --color-*: initial;\n' : ''}  ${keys
        .map(
          (key) =>
            `--color-${key}: var(--udx-${key}-dark-on, var(--udx-light-${key}));`,
        )
        .join('\n  ')}
}`;
    }

    emit(block(rootSelector, paletteStyles(colors)));

    const boundaries = [rootSelector];
    if (darkMode === 'media') {
      emit(
        `@media (prefers-color-scheme: dark) {\n    ${block(rootSelector, `${TOGGLE}: ;`).replace(/\n/g, '\n  ')}}\n`,
      );
    }
    if (darkSelector) {
      emit(block(darkSelector, `${TOGGLE}: ;`));
      boundaries.push(darkSelector);
    }
    if (lightSelector) {
      emit(block(lightSelector, `${TOGGLE}: initial;`));
      boundaries.push(lightSelector);
    }

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
      const subThemeSelector = createFlexibleSelector(
        isDynamic ? dynamicRootSelector : dynamicSelector,
        '.theme-' + key,
      );
      emit(block(subThemeSelector, paletteStyles(this.getColors())));
      boundaries.push('.theme-' + key);
    }
    // Restore original sourceColor after processing subThemes
    this.api.context.update({ sourceColor: originalRawSourceColor });

    // Last, so an element carrying both a palette and a toggle resolves once
    // with both already declared.
    emit(block(`:is(${boundaries.join(', ')})`, aliasStyles(keys)));
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
