import { defaultColors } from '../color';
import { bootstrap } from '../bootstrap';
import { registerModule } from '../app.container';
import { asValue } from 'awilix';
import { ConfigInterface } from '../config';
import { Variants } from '../variant/variants';

const initializeApi = () => {
  const api = bootstrap();
  registerModule({
    adapter: asValue(this),
  });
  return api;
};

export const loader = async (config: ConfigInterface) => {
  const api = initializeApi();

  const init = () => {
    const {
      sourceColor,
      contrastLevel = 0,
      isDark = false,
      variant = Variants.TonalSpot,
      palettes,
      colors,
      plugins,
    } = config;

    api.context.set({
      contrastLevel: contrastLevel,
      isDark: isDark,
      sourceColorHex: sourceColor,
      variant: variant,
    });

    api.colors.addColors(defaultColors);

    if (palettes) {
      api.palettes.add(palettes);
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

  init();
  await api.load();

  return api;
};
