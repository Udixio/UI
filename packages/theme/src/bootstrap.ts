import { AppContainer } from './app.container';
import { API } from './API';

/**
 * Construit un thème isolé.
 *
 * Chaque appel obtient son propre conteneur, donc son propre `Context`, ses
 * propres couleurs et ses propres palettes. Sans quoi deux thèmes vivant dans
 * le même processus — le worker de `ui-react`, un rendu SSR, une suite de
 * tests — se partageraient tout, et le second écraserait le premier.
 */
export function bootstrap(): API {
  return AppContainer({ fresh: true }).resolve<API>('api');
}
