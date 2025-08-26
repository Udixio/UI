import { resolveConfig } from '../config';
import { loader } from './loader';

export const loadFromPath = async (configPath = './theme.config') => {
  const { config, filePath } = await resolveConfig(configPath);
  const api = await loader(config);

  return { filePath, api: api };
};
