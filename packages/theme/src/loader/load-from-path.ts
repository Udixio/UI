import { loader } from './loader';
import { resolveConfig } from '../config/resolver-config';

export const loadFromPath = async (configPath = './theme.config') => {
  const { config, filePath } = await resolveConfig(configPath);
  const api = await loader(config);

  return { filePath, api: api };
};
