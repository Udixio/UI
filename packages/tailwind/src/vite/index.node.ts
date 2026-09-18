import { type ConfigInterface, loader, resolveConfig } from '@udixio/theme';
import {
  createUdixioPlugin,
  type UdixioViteOptions,
  type UdixioVitePlugin,
} from './plugin';

export { VIRTUAL_CSS_ID } from './plugin';
export type { UdixioViteOptions, UdixioVitePlugin } from './plugin';

/**
 * The Udixio Vite plugin: generates the theme's static CSS at build start and
 * whenever `theme.config` changes in dev.
 *
 * ```ts
 * // vite.config.ts
 * import udixio from '@udixio/tailwind/vite';
 * export default defineConfig({ plugins: [tailwindcss(), udixio()] });
 * ```
 *
 * The config is loaded from `configPath` (`./theme.config` by default), or
 * taken from `config` when passed in — in which case Vite itself restarts
 * on changes, the config being an import of `vite.config.ts`. Either way the
 * CSS is written to the config's `outFile` (`udixio.generated.css`), exactly
 * as `udixio-theme build` does, and is also served in memory as
 * `virtual:udixio/theme.css`.
 *
 * The same import resolves to a browser build under the `browser` export
 * condition, for bundlers running Vite plugins outside Node: there `config`
 * is required and the CSS is only served virtually — see `index.browser.ts`.
 */
export function udixio(options: UdixioViteOptions = {}): UdixioVitePlugin {
  const { config, configPath = './theme.config', verbose = false } = options;

  let resolvedConfigPath: string | undefined;
  let loaded: ConfigInterface | undefined = config;

  // The config: as passed in, or read from the file — again when `fresh`,
  // after a change.
  const getConfig = async (fresh = false): Promise<ConfigInterface> => {
    if (loaded && !fresh) return loaded;
    if (config) return config;
    const result = await resolveConfig(configPath);
    resolvedConfigPath ??= result.filePath;
    loaded = result.config;
    return result.config;
  };

  // Loads the theme, which writes the CSS: the node TailwindPlugin does the
  // write as part of `api.load()`.
  const loadTheme = async (fresh = false): Promise<void> => {
    if (verbose) {
      console.log(`🎨 Loading theme from: ${config ? 'config' : configPath}`);
    }
    await loader(await getConfig(fresh));
    if (verbose) {
      console.log('✅ Theme loaded successfully!');
    }
  };

  const plugin = createUdixioPlugin(getConfig, { claimGeneratedFile: false });

  return {
    ...plugin,

    async buildStart() {
      await loadTheme();
      if (resolvedConfigPath) this.addWatchFile(resolvedConfigPath);
    },

    async configureServer(server) {
      if (config) return;
      if (!resolvedConfigPath) await getConfig();
      if (resolvedConfigPath) server.watcher.add(resolvedConfigPath);
    },

    async handleHotUpdate({ server, file }) {
      if (!resolvedConfigPath || resolvedConfigPath !== file) return undefined;
      if (verbose) console.log(`🔄 Theme config changed: ${file}`);
      await loadTheme(true);
      server.ws.send({ type: 'full-reload', path: '*' });
      return [];
    },
  };
}

export default udixio;
