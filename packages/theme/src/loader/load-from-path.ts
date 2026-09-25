import { loader } from './loader';
import {
  resolveConfig,
  type ResolvedConfigResult,
} from '../config/resolver-config';

export const loadFromPath = async (
  configPath = './theme.config',
  resolved?: ResolvedConfigResult,
) => {
  const { config, filePath } = resolved ?? (await resolveConfig(configPath));
  const api = await loader(config);

  return { filePath, api: api };
};
