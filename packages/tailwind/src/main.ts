import { bootstrapFromConfig } from '@udixio/theme';
import { TailwindPlugin } from './tailwind.plugin';
import plugin from 'tailwindcss/plugin';

export const createTheme: () => Promise<
  ReturnType<typeof plugin.withOptions>
> = async () => {
  const app = await bootstrapFromConfig();
  const plugin = app.plugins.getPlugin(TailwindPlugin).getInstance();
  return plugin.load();
};
