import { defineConfig, FontPlugin } from './src';
import { TailwindPlugin } from './src/plugins/tailwind/tailwind.plugin';

module.exports = defineConfig({
  sourceColor: '#68548E',
  plugins: [
    new FontPlugin({}),
    new TailwindPlugin({
      darkMode: 'class',
      subThemes: {
        green: '#00FF00',
      },
    }),
  ],
});
