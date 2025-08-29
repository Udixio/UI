import { FontPlugin, PluginAbstract, PluginImplAbstract } from '@udixio/theme';

export interface TailwindPluginOptions {
  // darkMode?: 'class' | 'media';
  responsiveBreakPoints?: Record<string, number>;
  styleFilePath?: string;
  // subThemes?: Record<string, string>;
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
  protected colors: Record<
    string,
    {
      light: string;
      dark: string;
    }
  > = {};

  onInit() {
    this.options.responsiveBreakPoints ??= {
      lg: 1.125,
    };
  }

  loadColor() {
    this.outputCss += `
@variant dynamic-default (&:where(.dynamic, .dynamic *));
@variant dynamic-dark (&:where(.dynamic:where(.dark, .dark *), .dark:where(.dynamic, .dynamic *)));
@layer theme {
  .dynamic {
    ${Object.entries(this.colors)
      .map(([key, value]) => `--color-${key}: ${value.light};`)
      .join('\n  ')}
  }
}
@layer theme {
  :is(.dynamic.dark, .dynamic .dark, .dark .dynamic) {
    ${Object.entries(this.colors)
      .map(([key, value]) => `--color-${key}: ${value.dark};`)
      .join('\n  ')}
    }
}
`;
  }

  async onLoad() {
    console.log('onLoad');
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

    if (typeof window !== 'undefined') {
      const { tailwindBrowserInit } = await import('./tailwind-browser');

      this.outputCss = await tailwindBrowserInit(this.outputCss);
    }

    this.loadColor();
  }
}
