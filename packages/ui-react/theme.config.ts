import { defineConfig, FontPlugin, TailwindPlugin } from '@udixio/theme';

module.exports = defineConfig({
  sourceColor: '#6750A4',
  plugins: [
    new FontPlugin({}),
    new TailwindPlugin({
      darkMode: 'class',
    }),
  ],
});
