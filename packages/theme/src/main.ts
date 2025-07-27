import AppContainer from './app.container';
import { API } from './API';
import { ConfigInterface, ConfigService } from './config';

export function bootstrap(): API {
  return AppContainer.resolve<API>('api');
}

/** @deprecated Use `VitePlugin` plugin instead.*/
export async function bootstrapFromConfig(args?: {
  path?: string;
  config?: ConfigInterface;
}): Promise<API> {
  const configService = AppContainer.resolve<ConfigService>('configService');
  if (args?.path) configService.configPath = args.path;
  await configService.loadConfig(args?.config);
  return AppContainer.resolve<API>('api');
}
