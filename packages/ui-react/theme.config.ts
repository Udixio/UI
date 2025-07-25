import { defineConfig, FontPlugin } from '@udixio/theme';
import { TailwindPlugin } from '@udixio/tailwind';

export default defineConfig({
  sourceColor: '#6750A4',
  plugins: [
    new FontPlugin({}),
    new TailwindPlugin({
      // darkMode: 'class',
    }),
  ],
});
