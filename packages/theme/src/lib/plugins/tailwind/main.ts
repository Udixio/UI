import { bootstrapFromConfig } from '../../main';
import { TailwindPlugin } from './tailwind.plugin';

export const createTheme = () => {
  const app = bootstrapFromConfig();
  const plugin = app.plugins.getPlugin(TailwindPlugin).getInstance();
  return plugin.load();
};
