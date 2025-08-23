import { AdapterAbstract, ConfigInterface } from '../adapter';
import { resolve } from 'pathe';

export class NodeAdapter extends AdapterAbstract {
  constructor(public configPath = './theme.config') {
    super();
  }

  async getConfig() {
    if (
      typeof process !== 'undefined' &&
      process.release &&
      process.release.name === 'node'
    ) {
      const fs = (await import('fs')).default;
      const { pathToFileURL } = await import('url');

      // pathe gère automatiquement tous les formats de chemins
      const base = resolve(this.configPath);
      const extensions = ['.js', '.ts', '.mjs', '.cjs'];
      let configImport = null;

      for (const ext of extensions) {
        const configFilePath = base + ext;
        if (fs.existsSync(configFilePath)) {
          // Convertir en URL pour l'import dynamique
          const importPath = pathToFileURL(configFilePath).href;
          configImport = (await import(importPath)).default;
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
    } else {
      throw new Error(
        'You must provide configuration object when using this library in a browser.',
      );
    }
  }
}
