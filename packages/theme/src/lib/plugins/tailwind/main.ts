import { bootstrapFromConfig } from '../../main';
import { AppService } from '../../app.service';
import { TailwindPlugin } from './tailwind.plugin';
import { PluginsConfig } from 'tailwindcss/plugin';
import { setup } from './setup';

export type Theme = {
  colors: Record<string, string>;
  fontFamily: { expressive: string[]; neutral: string[] };
  plugins: Partial<PluginsConfig>;
};

export const createTheme = (): Theme & { appService: AppService } => {
  setup();
  const app = bootstrapFromConfig();
  const plugin = app.pluginService.getPlugin(TailwindPlugin).getInstance();
  return { ...plugin.getTheme(), appService: app };
};
