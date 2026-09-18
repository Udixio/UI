import {
  createUdixioPlugin,
  type UdixioViteOptions,
  type UdixioVitePlugin,
} from './plugin';

export { VIRTUAL_CSS_ID } from './plugin';
export type { UdixioViteOptions, UdixioVitePlugin } from './plugin';

/**
 * The Udixio Vite plugin, browser build: for bundlers that run Vite plugins
 * outside Node (a preview engine in the browser). Nothing here reaches the
 * file system, so:
 *
 * - `config` is required — import it from `theme.config.ts` in the Vite
 *   config;
 * - the static theme CSS is served in memory, both as
 *   `virtual:udixio/theme.css` and for any import of the `outFile` basename
 *   (`./udixio.generated.css` by default), so a project's stylesheet needs
 *   no change between Node and browser;
 * - `plugin.tailwind` carries the module behind `@plugin "@udixio/tailwind"`.
 *
 * No dev-server hooks: there is no server.
 */
export function udixio(options: UdixioViteOptions = {}): UdixioVitePlugin {
  const { config } = options;
  if (!config) {
    throw new Error(
      'udixio(): the browser build cannot load theme.config — pass it in: `udixio({ config })`.',
    );
  }
  return createUdixioPlugin(() => config, { claimGeneratedFile: true });
}

export default udixio;
