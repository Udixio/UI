import type { Plugin } from 'vite';
import { AdapterAbstract, ConfigInterface } from '../adapter';
import { FileAdapterMixin } from '../adapter/file-adapter.mixin';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

class Adapter extends AdapterAbstract {
  constructor(private configPath: string) {
    super();
  }

  async getConfig() {
    const base = resolve(this.configPath);
    const extensions = ['.js', '.ts', '.mjs', '.cjs'];
    let configImport = null;

    for (const ext of extensions) {
      const path = base + ext;
      if (existsSync(path)) {
        configImport = (await import(path)).default;
        break;
      }
    }

    if (!configImport) {
      throw new Error(
        `Configuration file not found, looked for: ${base} with extensions: ${extensions.join(', ')}`,
      );
    }

    let config: unknown;
    if ('default' in configImport) {
      config = configImport.default;
    } else {
      config = configImport;
    }

    return config as ConfigInterface;
  }
}

export const ViteAdapter = FileAdapterMixin(Adapter);

export const udixioVite = async (
  configPath = './theme.config',
): Promise<Plugin> => {
  const adapter = new ViteAdapter(configPath);
  await adapter.init();

  return {
    name: 'vite:config-watcher',
    buildStart() {
      adapter.load();
    },

    generateBundle() {
      adapter.load();
    },

    // Handles Hot Module Replacement in dev server
    async handleHotUpdate({ server, file, modules }) {
      // Vérifie si le fichier modifié correspond au chemin du fichier de config
      if (file === configPath) {
        const adapter = new ViteAdapter(configPath);
        await adapter.init();
        adapter.load();

        server.ws.send({ type: 'full-reload', path: '*' });

        return modules;
      }

      return [];
    },
  };
};
