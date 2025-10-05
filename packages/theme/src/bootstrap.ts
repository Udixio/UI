import { AppContainer } from './app.container';
import { API } from './API';

export function bootstrap(): API {
  return AppContainer().resolve<API>('api');
}
