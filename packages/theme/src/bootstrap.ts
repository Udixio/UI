import { AppContainer } from './app.container';
import { API } from './API';

/**
 * Builds an isolated theme.
 *
 * Each call gets its own container, hence its own `Context`, its own colors
 * and its own palettes. Otherwise two themes living in the same process — the
 * `ui-react` worker, an SSR render, a test suite — would share everything,
 * and the second would overwrite the first.
 */
export function bootstrap(): API {
  return AppContainer({ fresh: true }).resolve<API>('api');
}
