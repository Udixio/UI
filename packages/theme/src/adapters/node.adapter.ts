import { AdapterAbstract, ConfigInterface } from '../adapter';

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
      const path = (await import('path')).default;
      const fs = (await import('fs')).default;

      const base = path.resolve(this.configPath);
      const extensions = ['.js', '.ts', '.mjs', '.cjs'];
      let configImport = null;

      for (const ext of extensions) {
        const path = base + ext;
        if (fs.existsSync(path)) {
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
    } else {
      throw new Error(
        'You must provide configuration object when using this library in a browser.',
      );
    }
  }
}
