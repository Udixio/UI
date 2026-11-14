import config from '../../../apps/doc/theme.config';
import { generateStaticThemeCss } from '@udixio/tailwind';

/** Generate the actual documentation theme without reading or writing its ignored CSS file. */
export function generateDocTheme(): Promise<string> {
  return generateStaticThemeCss(config);
}
