import { FontPlugin, PluginAbstract, PluginImplAbstract } from '@udixio/theme';

export interface TailwindPluginOptions {
  darkMode?: 'class' | 'media';
  dynamicSelector?: string;
  darkSelector?: string;
  responsiveBreakPoints?: Record<string, number>;
  styleFilePath?: string;
  subThemes?: Record<string, string>;
}

function createFlexibleSelector(...classes: (string | undefined)[]): string {
  classes = classes.filter((classeName) => !!classeName);
  if (classes.length === 0) return '';
  if (classes.length === 1 && classes[0]) return classes[0];

  // Approche plus simple : générer les cas les plus courants
  const selectors: string[] = [];

  // 1. Toutes les classes sur le même élément
  selectors.push(classes.join(''));

  // 2. Chaque classe comme ancêtre des autres
  for (let i = 0; i < classes.length; i++) {
    const ancestor = classes[i];
    const descendants = classes.filter(
      (className, index) => index !== i && !!className,
    );

    if (descendants.length === 1) {
      selectors.push(`${ancestor} ${descendants[0]}`);
    } else if (descendants.length > 1) {
      selectors.push(`${ancestor} ${descendants.join('')}`);
      // Aussi les descendants séparés
      for (const desc of descendants) {
        selectors.push(`${ancestor} ${desc}`);
      }
    }
  }

  // 3. Permutations adjacentes (A B, B A)
  for (let i = 0; i < classes.length; i++) {
    for (let j = i + 1; j < classes.length; j++) {
      selectors.push(`${classes[i]} ${classes[j]}`);
      selectors.push(`${classes[j]} ${classes[i]}`);
    }
  }

  // Supprimer les doublons
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

  onInit() {
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

    if (isDynamic) {
      this.outputCss += `
@layer theme {
  .dynamic {
    ${Object.entries(colors)
      .map(([key, value]) => `--color-${key}: ${value.light};`)
      .join('\n  ')}
  }
}`;
    } else {
      this.outputCss += `
@theme {
  --color-*: initial;
  ${Object.entries(colors)
    .map(([key, value]) => `--color-${key}: ${value.light};`)
    .join('\n  ')}
}`;
    }

    this.outputCss += `
@layer theme {
  ${darkStyle({
    selectors: [dynamicSelector],
    mode: darkMode,
    darkSelector: darkSelector ?? '',
    styles: Object.entries(colors)
      .map(([key, value]) => `--color-${key}: ${value.dark};`)
      .join('\n    '),
  })} 
}`;

    for (const [key, value] of Object.entries(this.options.subThemes ?? {})) {
      this.api.themes.update({ sourceColorHex: value });
      const colors = this.getColors();
      this.outputCss += `
@layer theme {
  ${createFlexibleSelector(dynamicSelector, '.theme-' + key)} {
    ${Object.entries(colors)
      .map(([key, value]) => `--color-${key}: ${value.dark};`)
      .join('\n    ')}
    }
}
`;

      this.outputCss += `
@layer theme {
  ${darkStyle({
    selectors: [dynamicSelector, '.theme-' + key],
    mode: darkMode,
    darkSelector: darkSelector ?? '',
    styles: Object.entries(colors)
      .map(([key, value]) => `--color-${key}: ${value.dark};`)
      .join('\n    '),
  })} 
}`;
    }
  }

  getColors() {
    const colors: Record<
      string,
      {
        light: string;
        dark: string;
      }
    > = {};
    for (const isDark of [false, true]) {
      this.api.themes.update({ isDark: isDark });
      for (const [key, value] of this.api.colors.getColors().entries()) {
        const newKey = key
          .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
          .toLowerCase();
        colors[newKey] ??= { light: '', dark: '' };
        colors[newKey][isDark ? 'dark' : 'light'] = value.getHex();
      }
    }

    return colors;
  }

  async onLoad() {
    this.getColors();

    if (typeof window !== 'undefined') {
      const { tailwindBrowserInit } = await import('./tailwind-browser');

      this.outputCss = await tailwindBrowserInit(this.outputCss);
    }
    this.loadColor({ isDynamic: true });
  }
}
