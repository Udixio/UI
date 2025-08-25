import { Plugin } from 'vite';
import { loadFromPath } from './load-from-path';

export const udixioVite = async (
  configPath = './theme.config',
): Promise<Plugin | undefined> => {
  if (global.NX_GRAPH_CREATION) {
    return;
  }

  let resolvedConfigPath: string;

  return {
    name: 'vite:udixio-theme',
    async buildStart() {
      await loadFromPath(configPath);
    },

    async generateBundle() {
      await loadFromPath(configPath);
    },

    // Handles Hot Module Replacement in dev server
    async handleHotUpdate({ server, file, modules }) {
      if (!resolvedConfigPath) {
        resolvedConfigPath = (await loadFromPath(configPath)).filePath;
      }
      if (resolvedConfigPath === file) {
        server.ws.send({ type: 'full-reload', path: '*' });
        return modules;
      }
      return;
    },
  };
};
