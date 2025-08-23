import { AdapterAbstract, ConfigInterface } from '../adapter';
import { resolve } from 'pathe';
import { createJiti } from 'jiti';

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

      // Créer une instance jiti pour importer des fichiers TypeScript
      const jiti = createJiti(import.meta.url, {
        // Options optionnelles
        debug: process.env.NODE_ENV === 'development',
        cache: true, // Cache les transpilations
        interopDefault: true, // Gère automatiquement les exports par défaut
      });

      const base = resolve(this.configPath);
      const extensions = ['.ts', '.js', '.mjs', '.cjs']; // .ts en premier
      let config: ConfigInterface | null = null;

      for (const ext of extensions) {
        const configFilePath = base + ext;
        if (fs.existsSync(configFilePath)) {
          try {
            // jiti peut importer directement des fichiers .ts
            config = await jiti.import(configFilePath, { default: true });
            break;
          } catch (error) {
            console.warn(`Failed to load ${configFilePath}:`, error);
            continue;
          }
        }
      }

      if (!config) {
        throw new Error(
          `Configuration file not found, looked for: ${base} with extensions: ${extensions.join(', ')}`,
        );
      }

      return config as ConfigInterface;
    } else {
      throw new Error(
        'You must provide configuration object when using this library in a browser.',
      );
    }
  }
}
