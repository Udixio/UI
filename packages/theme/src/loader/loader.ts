import { defaultColors } from '../color';
import { bootstrap } from '../bootstrap';
import { ConfigInterface } from '../config';
import { Variants } from '../variant/variants';

export const loader = async (config: ConfigInterface) => {
  const api = bootstrap();

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
      sourceColor,
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
