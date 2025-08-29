import { FontPlugin, PluginAbstract } from '@udixio/theme';

import { TailwindImplPluginBrowser, TailwindPluginOptions } from '../browser/tailwind.plugin';

import { ConfigCss } from '../main';

export class TailwindPlugin extends PluginAbstract<
  TailwindImplPlugin,
  TailwindPluginOptions
> {
  public dependencies = [FontPlugin];
  public name = 'tailwind';
  pluginClass = TailwindImplPlugin;
}

class TailwindImplPlugin extends TailwindImplPluginBrowser {
  private isNodeJs(): boolean {
    return (
      typeof process !== 'undefined' &&
      process.versions != null &&
      process.versions.node != null
    );
  }

  override loadColor() {
    if (!this.isNodeJs()) {
      super.loadColor();
      return;
    }
    this.outputCss += `
@custom-variant dark (&:where(.dark, .dark *));
@theme {
  --color-*: initial;
  ${Object.entries(this.colors)
    .map(([key, value]) => `--color-${key}: ${value.light};`)
    .join('\n  ')}
}
@layer theme {
  .dark {
    ${Object.entries(this.colors)
      .map(([key, value]) => `--color-${key}: ${value.dark};`)
      .join('\n  ')}
  }
}
`;
  }

  override async onLoad() {
    if (!this.isNodeJs()) {
      await super.onLoad();
      return;
    }
    const { join, resolve } = await import('pathe');

    const {
      createOrUpdateFile,
      findProjectRoot,
      findTailwindCssFile,
      getFileContent,
      replaceFileContent,
    } = await import('./file');
    this.colors = {};
    for (const isDark of [false, true]) {
      this.api.themes.update({ isDark: isDark });
      for (const [key, value] of this.api.colors.getColors().entries()) {
        const newKey = key
          .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
          .toLowerCase();
        this.colors[newKey] ??= { light: '', dark: '' };
        this.colors[newKey][isDark ? 'dark' : 'light'] = value.getHex();
      }
    }

    let udixioCssPath = this.options.styleFilePath;

    const projectRoot = await findProjectRoot(resolve());

    if (!udixioCssPath) {
      const searchPattern = /@import ["']tailwindcss["'];/;
      const replacement = `@import 'tailwindcss';\n@import "./udixio.css";`;

      const tailwindCssPath = await findTailwindCssFile(
        projectRoot,
        searchPattern,
      );
      udixioCssPath = join(tailwindCssPath, '../udixio.css');

      if (
        !(await getFileContent(tailwindCssPath, /@import\s+"\.\/udixio\.css";/))
      ) {
        await replaceFileContent(tailwindCssPath, searchPattern, replacement);
      }
    }

    const { fontStyles, fontFamily } = this.api.plugins
      .getPlugin(FontPlugin)
      .getInstance()
      .getFonts();

    const configCss: ConfigCss = {
      colorKeys: Object.keys(this.colors).join(', ') as any,
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
        .join(', ') as any,
      responsiveBreakPoints: Object.entries(
        this.options.responsiveBreakPoints ?? {},
      )
        .map(([key, value]) => `${key} ${value}`)
        .join(', ') as any,
    };

    this.outputCss += `@plugin "@udixio/tailwind" {
  colorKeys: ${configCss.colorKeys};
  fontStyles: ${configCss.fontStyles};
  responsiveBreakPoints: ${configCss.responsiveBreakPoints};
}`;
    this.loadColor();
    this.outputCss += `
@theme {
  ${Object.entries(fontFamily)
    .map(
      ([key, values]) =>
        `--font-${key}: ${values.map((value) => `"${value}"`).join(', ')};`,
    )
    .join('\n  ')}
}`;

    await createOrUpdateFile(udixioCssPath, this.outputCss);
  }
}
