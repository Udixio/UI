import { PluginAbstract, PluginImplAbstract } from '../../plugin';
import { FontPlugin } from '../font';
import plugin from 'tailwindcss/plugin';
import { createFile, findTailwindCssFile, replaceFileContent } from './file';
import path from 'path';

interface TailwindPluginOptions {
  darkMode?: 'class' | 'media';
  responsiveBreakPoints?: Record<string, number>;
  subThemes?: Record<string, string>;
}

export class TailwindPlugin extends PluginAbstract<
  TailwindImplPlugin,
  TailwindPluginOptions
> {
  public dependencies = [FontPlugin];
  public name = 'tailwind';
  pluginClass = TailwindImplPlugin;
}

class TailwindImplPlugin extends PluginImplAbstract<TailwindPluginOptions> {
  onInit() {
    this.options.darkMode ??= 'class';
    this.options.responsiveBreakPoints ??= {
      lg: 1.125,
    };
  }

  load() {
    const searchKeyword = '@plugin "@udixio/tailwind"';

    const tailwindCssPath = findTailwindCssFile(process.cwd(), searchKeyword);
    if (!tailwindCssPath) {
      throw new Error(
        'Tailwind plugin not found. Please use it first. (@plugin "@udixio/tailwind")',
      );
    }
    const searchPattern = /@plugin "@udixio\/tailwind"\s*{\s*}/;
    const replacement = `@plugin "@udixio/tailwind" {\n}\n@import "./udixio.css" layer(theme);`;

    replaceFileContent(tailwindCssPath, searchPattern, replacement);
    const cssFilePath = path.dirname(tailwindCssPath);

    const colors: Record<
      string,
      {
        light: string;
        dark: string;
      }
    > = {};

    for (const isDark of [false, true]) {
      this.appService.themeService.update({ isDark: isDark });
      for (const [key, value] of this.appService.colorService
        .getColors()
        .entries()) {
        const newKey = key
          .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
          .toLowerCase();
        colors[newKey] ??= { light: '', dark: '' };
        colors[newKey][isDark ? 'dark' : 'light'] = value.getHex();
      }
    }

    const { fontStyles, fontFamily } = this.appService.pluginService
      .getPlugin(FontPlugin)
      .getInstance()
      .getFonts();

    createFile(
      path.join(cssFilePath, 'udixio.css'),
      `@theme {
    --color-*: initial;      
  ${Object.entries(colors)
    .map(([key, value]) => `--color-${key}: ${value.light};`)
    .join('\n  ')}
}`,
    );

    return plugin.withOptions(
      // 1) factory(options) → la fonction “handler” du plugin
      (options = {}) => {
        return async function ({
          addUtilities,
          theme,
          addComponents,
          addBase,
        }) {
          // vous pourriez créer ici des utilitaires avec addUtilities()
          // par exemple pour raccourcir l’usage de primary
          // const utils = {
          //   '.text-primary': { color: theme('colors.primary.DEFAULT') },
          // }
          // addUtilities(utils, { variants: ['responsive', 'hover'] })
        };
      },
      // 2) config(options) → objet à merger dans tailwind.config
      (options = {}) => {
        return {
          // theme: {
          //   colors: {
          //     // on récupère l’objet options.palette ou on tombe
          //     // sur un fallback minimal
          //     primary: options.palette || {
          //       50: '#f0f5ff',
          //       100: 'rgba(245,17,17,0.82)',
          //       500: '#6366f1',
          //       700: '#b9b6da',
          //       DEFAULT: '#b71b1b',
          //     },
          //   },
          // },
        };
      },
    );
  }
}
