import { resolveConfig } from '../config';
import { loader } from './loader';

export const loadFromPath = async (configPath = './theme.config') => {
  const { config, filePath } = await resolveConfig(configPath);
  loader({
    config,
  });

  return { filePath };
};
