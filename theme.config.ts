import {
  defineConfig,
  FontPlugin,
  TailwindPlugin,
  VariantModel,
} from '@udixio/theme';
import {
  sanitizeDegreesDouble,
  TonalPalette,
} from '@material/material-color-utilities';

module.exports = defineConfig({
  sourceColor: '#6750A4',
  variant: {
    ...VariantModel.tonalSpot,
    palettes: {
      ...VariantModel.tonalSpot.palettes,
      secondary: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(sourceColorHct.hue, 24.0),
      tertiary: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(
          sanitizeDegreesDouble(sourceColorHct.hue + 45.0),
          24.0
        ),
    },
  },

  plugins: [
    new FontPlugin({}),
    new TailwindPlugin({
      darkMode: 'class',
    }),
  ],
});
