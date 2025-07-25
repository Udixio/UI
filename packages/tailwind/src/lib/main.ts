import { bootstrapFromConfig } from '@udixio/theme';
import { TailwindPlugin } from './tailwind.plugin';
import plugin from 'tailwindcss/plugin';

export const createTheme: () => ReturnType<typeof plugin.withOptions> = () => {
  const app = bootstrapFromConfig();
  const plugin = app.plugins.getPlugin(TailwindPlugin).getInstance();
  return plugin.load();
};
