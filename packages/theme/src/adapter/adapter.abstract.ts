import { ConfigInterface } from './config.interface';
import { tonalSpotVariant } from '../theme';
import { defaultColors } from '../color';
import { bootstrap } from '../bootstrap';
import { API } from '../API';
import { registerModule } from '../app.container';
import { asValue } from 'awilix';

export abstract class AdapterAbstract {
  public api: API;

  protected constructor() {
    this.api = bootstrap();
    registerModule({
      adapter: asValue(this),
    });
  }

  abstract getConfig(): Promise<ConfigInterface | null>;

  public async init(): Promise<void> {
    const config = await this.getConfig();
    if (config == null) {
      return;
    }
    const {
      sourceColor,
      contrastLevel = 0,
      isDark = false,
      variant = tonalSpotVariant,
      palettes,
      colors,
      useDefaultColors = true,
      plugins,
    } = config;
    this.api.themes.create({
      contrastLevel: contrastLevel,
      isDark: isDark,
      sourceColorHex: sourceColor,
      variant: variant,
    });
    if (palettes) {
      Object.entries(palettes).forEach(([key, value]) =>
        this.api.themes.addCustomPalette(key, value),
      );
    }
    if (useDefaultColors) {
      this.api.colors.addColors(defaultColors);
    }
    if (colors) {
      this.api.colors.addColors(colors);
    }
    if (plugins) {
      plugins.forEach((plugin) => {
        this.api.plugins.addPlugin(plugin);
      });
      this.api.plugins.initPlugins(this.api);
    }
  }

  public load() {
    this.api.plugins.loadPlugins();
  }
}
