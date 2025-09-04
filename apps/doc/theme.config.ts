import { defineConfig, FontPlugin, Variants } from '@udixio/theme';
import { TailwindPlugin } from '@udixio/tailwind';

export default defineConfig({
  sourceColor: '#6750A4',
  variant: Variants.Fidelity,
  plugins: [new FontPlugin({}), new TailwindPlugin({})],
  colors: (colorService) => ({
    fromPalettes: ['success'],
  }),
  palettes: {
    success: '#4CAF50',
  },
});
