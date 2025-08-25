import { tonalSpotVariant } from '../theme';
import { defaultColors } from '../color';
import { bootstrap } from '../bootstrap';
import { registerModule } from '../app.container';
import { asValue } from 'awilix';
import { ConfigInterface } from '../config/config.interface';

const initializeApi = () => {
  const api = bootstrap();
  registerModule({
    adapter: asValue(this),
  });
  return api;
};

export const loader = ({ config }: { config: ConfigInterface }) => {
  const api = initializeApi();

  const init = () => {
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
    api.themes.create({
      contrastLevel: contrastLevel,
      isDark: isDark,
      sourceColorHex: sourceColor,
      variant: variant,
    });
    if (palettes) {
      Object.entries(palettes).forEach(([key, value]) =>
        api.themes.addCustomPalette(key, value),
      );
    }
    if (useDefaultColors) {
      api.colors.addColors(defaultColors);
    }
    if (colors) {
      api.colors.addColors(colors);
    }
    if (plugins) {
      plugins.forEach((plugin) => {
        api.plugins.addPlugin(plugin);
      });
      api.plugins.initPlugins(api);
    }
  };

  const load = () => {
    api.plugins.loadPlugins();
  };

  init();
  load();

  return {
    load,
    init,
  };
};
