import {
  createOrUpdateFile,
  findTailwindCssFile,
  getFileContent,
  replaceFileContent,
} from './file';
import path from 'path';
import { FontPlugin, PluginAbstract, PluginImplAbstract } from '@udixio/theme';
import { ConfigCss } from './main';

interface TailwindPluginOptions {
  // darkMode?: 'class' | 'media';
  responsiveBreakPoints?: Record<string, number>;
  styleFilePath?: string;
  // subThemes?: Record<string, string>;
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
    this.options.responsiveBreakPoints ??= {
      lg: 1.125,
    };
  }

  onLoad() {
    const searchKeyword = "@import 'tailwindcss';";

    const tailwindCssPath =
      this.options.styleFilePath ??
      findTailwindCssFile(process.cwd(), searchKeyword);
    if (!tailwindCssPath) {
      throw new Error('The style file containing tailwind was not found.');
    }
    const searchPattern = /@import ["']tailwindcss["'];/;
    const replacement = `@import 'tailwindcss';\n@import "./udixio.css";`;

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

    const configCss: ConfigCss = {
      colorKeys: Object.keys(colors).join(', '),
      fontStyles: Object.entries(fontStyles)
        .map(([fontRole, fontStyle]) =>
          Object.entries(fontStyle)
            .map(
              ([fontSize, fontStyle]) =>
                `${fontRole}-${fontSize} ${Object.entries(fontStyle)
                  .map(([name, value]) => `${name}[${value}]`)
                  .join(' ')}`,
            )
            .join(', '),
        )
        .join(', '),
      responsiveBreakPoints: Object.entries(
        this.options.responsiveBreakPoints ?? {},
      )
        .map(([key, value]) => `${key} ${value}`)
        .join(', '),
    };

    createOrUpdateFile(
      path.join(cssFilePath, 'udixio.css'),
      `
@plugin "@udixio/tailwind" {
  colorKeys: ${configCss.colorKeys};
  fontStyles: ${configCss.fontStyles};
  responsiveBreakPoints: ${configCss.responsiveBreakPoints};
}
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
@theme {
  ${Object.entries(fontFamily)
    .map(
      ([key, values]) =>
        `--font-${key}: ${values.map((value) => `"${value}"`).join(', ')};`,
    )
    .join('\n  ')}
}
`,
    );
  }
}
