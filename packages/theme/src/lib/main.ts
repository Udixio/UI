import AppContainer from './app.container';
import { API } from './API';
import { ConfigInterface, ConfigService } from './config';

export function bootstrap(): API {
  return AppContainer.resolve<API>('appService');
}

export function bootstrapFromConfig(args?: {
  path?: string;
  config?: ConfigInterface;
}): API {
  const configService = AppContainer.resolve<ConfigService>('configService');
  if (args?.path) configService.configPath = args.path;
  configService.loadConfig(args?.config);
  return AppContainer.resolve<API>('appService');
}
