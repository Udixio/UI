import { ConfigInterface } from './config.interface';

import { defaultColors } from '../color';
import { VariantModel } from '../theme';
import { API } from '../API';

export function defineConfig(configObject: ConfigInterface): ConfigInterface {
  if (!configObject || typeof configObject !== 'object') {
    throw new Error('The configuration is missing or not an object');
  }
  if (!('sourceColor' in configObject)) {
    throw new Error('Invalid configuration');
  }
  return configObject as ConfigInterface;
}

export class ConfigService {
  configPath = './theme.config';

  private readonly api: API;

  constructor({ api }: { api: API }) {
    this.api = api;
  }

  public loadConfig(config?: ConfigInterface): void {
    const {
      sourceColor,
      contrastLevel = 0,
      isDark = false,
      variant = VariantModel.tonalSpot,
      palettes,
      colors,
      useDefaultColors = true,
      plugins,
    } = config ?? this.getConfig();
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
      this.api.plugins.loadPlugins(this.api);
    }
  }

  private getConfig(): ConfigInterface {
    if (
      typeof process !== 'undefined' &&
      process.release &&
      process.release.name === 'node'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('path');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');

      const base = path.resolve(this.configPath);
      const extensions = ['.js', '.ts', '.jms', '.jcs'];
      let configImport = null;

      for (const ext of extensions) {
        const path = base + ext;
        if (fs.existsSync(path)) {
          configImport = require(path);
          break;
        }
      }

      if (!configImport) {
        throw new Error(
          `Configuration file not found, looked for: ${base} with extensions: ${extensions.join(', ')}`,
        );
      }

      let config: unknown;
      if ('default' in configImport) {
        config = configImport.default;
      } else {
        config = configImport;
      }

      return config as ConfigInterface;
    } else {
      throw new Error(
        'You must provide configuration object when using this library in a browser.',
      );
    }
  }
}
