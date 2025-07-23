import { bootstrapFromConfig } from '../../main';
import { TailwindPlugin } from './tailwind.plugin';
import { PluginsConfig } from 'tailwindcss/plugin';

export type Theme = {
  colors: Record<string, string>;
  fontFamily: { expressive: string[]; neutral: string[] };
  plugins: Partial<PluginsConfig>;
};

export const createTheme = () => {
  const app = bootstrapFromConfig();
  const plugin = app.plugins.getPlugin(TailwindPlugin).getInstance();
  return plugin.load();
};
