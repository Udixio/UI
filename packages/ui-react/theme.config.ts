import { defineConfig, FontPlugin, TailwindPlugin } from '@udixio/theme';

export default defineConfig({
  sourceColor: '#6750A4',
  plugins: [
    new FontPlugin({}),
    new TailwindPlugin({
      darkMode: 'class',
    }),
  ],
});
