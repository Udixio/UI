import { Plugin } from 'vite';
import * as fs from 'node:fs';
import { UniversalAdapter } from './universal.adapter';
import { resolveConfig } from '../core/config-loader';

export const udixioVite = async (
  configPath = './theme.config',
): Promise<Plugin | undefined> => {
  // @ts-expect-error - NX_GRAPH_CREATION is a global variable set by Nx
  if (global.NX_GRAPH_CREATION) {
    return;
  }

  const adapter = new UniversalAdapter(configPath);
  await adapter.init();

  // resolve the actual file path to watch
  let resolvedConfigPath: string;
  try {
    const result = await resolveConfig(configPath);
    resolvedConfigPath = result.filePath;
  } catch (e) {
    // if not found yet, default to configPath (Vite will just not watch if missing)
    resolvedConfigPath = configPath;
  }

  return {
    name: 'vite:udixio-theme',
    async buildStart() {
      if (fs.existsSync(resolvedConfigPath)) {
        this.addWatchFile(resolvedConfigPath);
      }
      adapter.load();
    },

    async generateBundle() {
      adapter.load();
    },

    // Handles Hot Module Replacement in dev server
    async handleHotUpdate({ server, file, modules }) {
      if (resolvedConfigPath === file) {
        const a = new UniversalAdapter(configPath);
        await a.init();
        a.load();
        server.ws.send({ type: 'full-reload', path: '*' });
        return modules;
      }
      return;
    },
  };
};
