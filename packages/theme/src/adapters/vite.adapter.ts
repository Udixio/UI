import { loadConfigFromFile, Plugin } from 'vite';
import { AdapterAbstract, ConfigInterface } from '../adapter';
import * as path from 'node:path';
import * as fs from 'node:fs';

export const udixioVite = async (
  configPath = './theme.config',
): Promise<Plugin | undefined> => {
  // @ts-expect-error - NX_GRAPH_CREATION is a global variable set by Nx
  if (global.NX_GRAPH_CREATION) {
    return;
  }

  class ViteAdapter extends AdapterAbstract {
    public configExtension?: string;

    constructor(public configPath: string) {
      super();
    }

    getConfigPath() {
      if (!this.configExtension) {
        throw new Error('config extension not found');
      }
      return path.resolve(this.configPath + this.configExtension);
    }

    async getConfig() {
      const resolvedPath = path.resolve(this.configPath);

      const result = await loadConfigFromFile(
        { command: 'serve', mode: 'development' }, // ou 'build'
        resolvedPath,
      );
      if (!result?.config) {
        throw new Error('config not found');
      }
      if (!this.configExtension) {
        this.configExtension = path.extname(result.dependencies[0]);
      }
      return result.config as unknown as ConfigInterface;
    }
  }

  const adapter = new ViteAdapter(configPath);

  await adapter.init();

  configPath = adapter.getConfigPath();
  return {
    name: 'vite:udixio-theme',
    async buildStart() {
      if (fs.existsSync(configPath)) {
        this.addWatchFile(configPath);
      }
      adapter.load();
    },

    async generateBundle() {
      adapter.load();
    },

    // Handles Hot Module Replacement in dev server
    async handleHotUpdate({ server, file, modules }) {
      // Vérifie si le fichier modifié correspond au chemin du fichier de config
      if (configPath === file) {
        const adapter = new ViteAdapter(configPath);
        await adapter.init();
        adapter.load();

        server.ws.send({ type: 'full-reload', path: '*' });

        return modules;
      }

      return;
    },
  };
};
