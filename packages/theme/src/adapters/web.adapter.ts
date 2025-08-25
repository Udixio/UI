import type { ConfigInterface } from '../adapter';
import { AdapterAbstract } from '../adapter';

type LoaderResult = { default: ConfigInterface } | ConfigInterface;
type ConfigLoader = () => Promise<LoaderResult>;

export interface WebAdapterOptions {
  configObject?: ConfigInterface; // 1) objet direct
  loadModule?: ConfigLoader; // 2) loader d’import dynamique
}

export class WebAdapter extends AdapterAbstract {
  constructor(private options: WebAdapterOptions) {
    super();
    if (!options.configObject && !options.loadModule) {
      throw new Error(
        'WebAdapter requires either configObject or loadModule()',
      );
    }
  }

  async getConfig(): Promise<ConfigInterface> {
    if (this.options.configObject) return this.options.configObject;
    if (this.options.loadModule) {
      const mod = await this.options.loadModule();
      const cfg = (mod as any)?.default ?? mod;
      return cfg as ConfigInterface;
    }
    throw new Error('No configuration source provided for WebAdapter.');
  }
}
