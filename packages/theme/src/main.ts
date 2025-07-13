import AppContainer from './app.container';
import { AppService } from './app.service';
import { ConfigInterface, ConfigService } from './config';

export function bootstrap(): AppService {
  return AppContainer.resolve<AppService>('appService');
}

export function bootstrapFromConfig(args?: {
  path?: string;
  config?: ConfigInterface;
}): AppService {
  const configService = AppContainer.resolve<ConfigService>('configService');
  if (args?.path) configService.configPath = args.path;
  configService.loadConfig(args?.config);
  return AppContainer.resolve<AppService>('appService');
}
