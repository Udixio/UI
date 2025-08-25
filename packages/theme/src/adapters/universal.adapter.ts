import { AdapterAbstract } from '../adapter';
import type { ConfigInterface } from '../adapter';
import { resolveConfig } from '../core/config-loader';

export class UniversalAdapter extends AdapterAbstract {
  constructor(public configPath = './theme.config') {
    super();
  }

  async getConfig(): Promise<ConfigInterface> {
    const { config } = await resolveConfig(this.configPath);
    return config;
  }
}
