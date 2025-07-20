import { PluginAbstract, PluginImplAbstract } from '../../plugin';
import { Theme } from './main';
import { FontPlugin } from '../font';

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

  getTheme(): Theme {
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
    return {
      colors: {},
      fontFamily: fontFamily,
      plugins: [
        // state(Object.keys(colors)),
        // font(fontStyles, this.options.responsiveBreakPoints!),
        // themer({
        //   colors,
        //   darkMode: this.options.darkMode!,
        //   subThemes: this.options.subThemes,
        //   appService: this.appService,
        // }),
      ],
    };
  }
}
