import { PluginAbstract, PluginImplAbstract } from '../../plugin';
import { FontPlugin } from '../font';
import plugin from 'tailwindcss/plugin';
import {
  createOrUpdateFile,
  findTailwindCssFile,
  getFileContent,
  replaceFileContent,
} from './file';
import path from 'path';
import { font } from './plugins-tailwind/font';
import { state } from './plugins-tailwind';

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

  load(): ReturnType<typeof plugin.withOptions> {
    const searchKeyword = '@plugin "@udixio/tailwind"';

    const tailwindCssPath = findTailwindCssFile(process.cwd(), searchKeyword);
    if (!tailwindCssPath) {
      throw new Error(
        'Tailwind plugin not found. Please use it first. (@plugin "@udixio/tailwind")',
      );
    }
    const searchPattern = /@plugin "@udixio\/tailwind"\s*{\s*}/;
    const replacement = `@plugin "@udixio/tailwind" {\n}\n@import "./udixio.css";`;

    if (!getFileContent(tailwindCssPath, /@import\s+"\.\/udixio\.css";/)) {
      replaceFileContent(tailwindCssPath, searchPattern, replacement);
    }

    const cssFilePath = path.dirname(tailwindCssPath);

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

    const { fontStyles, fontFamily } = this.api.plugins
      .getPlugin(FontPlugin)
      .getInstance()
      .getFonts();

    createOrUpdateFile(
      path.join(cssFilePath, 'udixio.css'),
      `
@custom-variant dark (&:where(.dark, .dark *));
@theme {
    --color-*: initial;
  ${Object.entries(colors)
    .map(([key, value]) => `--color-${key}: ${value.light};`)
    .join('\n  ')}
}
@layer theme {
  .dark {
  ${Object.entries(colors)
    .map(([key, value]) => `--color-${key}: ${value.dark};`)
    .join('\n  ')}
  }
}
`,
    );

    const plugins = [
      state(Object.keys(colors)),
      font(fontStyles, this.options.responsiveBreakPoints!),
    ];

    return plugin.withOptions(
      // 1) factory(options) → la fonction “handler” du plugin
      (options = {}) => {
        return async function (api) {
          plugins.forEach((plugin) => {
            plugin.handler(api);
          });
        };
      },
      // 2) config(options) → objet à merger dans tailwind.config
      (options = {}) => {
        return {
          theme: {
            fontFamily,
          },
        };
      },
    );
  }
}
