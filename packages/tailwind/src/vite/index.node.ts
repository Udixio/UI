import {
  getThemeBuildArtifacts,
  hasCachedThemeBuildArtifacts,
  type ConfigInterface,
  loader,
  resolveConfig,
} from '@udixio/theme';
import { existsSync, readFileSync } from 'node:fs';
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
  let loadingTheme: Promise<void> | undefined;
  let themeNeedsReload = true;
  let themeRevision = 0;
  let themeHasLoaded = false;
  let backgroundRefreshPending = false;
  let sendFullReload: (() => void) | undefined;

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
  const markThemeDirty = () => {
    themeNeedsReload = true;
    themeRevision += 1;
  };

  const loadTheme = async (fresh = false): Promise<void> => {
    if (loadingTheme) {
      return loadingTheme;
    }

    loadingTheme = (async () => {
      let nextFresh = fresh;

      try {
        do {
          const revisionBeingLoaded = themeRevision;
          const currentConfig = await getConfig(nextFresh);

          if (verbose) {
            console.log(
              `🎨 Loading theme from: ${config ? 'config' : configPath}`,
            );
          }
          await loader(currentConfig);
          nextFresh = true;

          // If the config changed while loading, immediately process the
          // latest revision before allowing the next build to continue.
          if (themeRevision === revisionBeingLoaded) {
            themeNeedsReload = false;
            themeHasLoaded = true;
          }
          if (verbose) {
            console.log('✅ Theme loaded successfully!');
          }
        } while (themeNeedsReload);
      } catch (error) {
        themeNeedsReload = true;
        console.error('❌ Theme loading failed:', error);
        throw error;
      } finally {
        loadingTheme = undefined;
      }
    })();

    return loadingTheme;
  };

  const refreshInBackground = () => {
    backgroundRefreshPending = true;
    void loadTheme()
      .then(() => {
        if (backgroundRefreshPending) {
          sendFullReload?.();
        }
      })
      .catch(() => undefined)
      .finally(() => {
        backgroundRefreshPending = false;
      });
  };

  const plugin = createUdixioPlugin(getConfig, {
    claimGeneratedFile: false,
    loadCachedCss: async (currentConfig) => {
      const artifact = getThemeBuildArtifacts(currentConfig).find(
        ({ kind }) => kind === 'css',
      );
      if (!artifact || !existsSync(artifact.path)) {
        return null;
      }

      try {
        return readFileSync(artifact.path, 'utf8');
      } catch {
        // The file may be replaced atomically while Vite is resolving it.
        // Falling back to generation keeps the virtual module reliable.
        return null;
      }
    },
  });

  return {
    ...plugin,

    async buildStart() {
      const currentConfig = await getConfig();
      for (const artifact of getThemeBuildArtifacts(currentConfig)) {
        this.addWatchFile(artifact.path);
      }

      if (themeNeedsReload) {
        const isInitialLoad = !themeHasLoaded && themeRevision === 0;

        if (isInitialLoad && hasCachedThemeBuildArtifacts(currentConfig)) {
          // A generated CSS file is already available. Start the expensive
          // theme load in the background so Vite can begin immediately.
          refreshInBackground();
        } else {
          await loadTheme();
        }
      }
      if (resolvedConfigPath) this.addWatchFile(resolvedConfigPath);
    },

    async configureServer(server) {
      sendFullReload = () => server.ws.send({ type: 'full-reload', path: '*' });
      if (config) return;
      if (!resolvedConfigPath) await getConfig();
      if (resolvedConfigPath) server.watcher.add(resolvedConfigPath);
    },

    async handleHotUpdate({ server, file }) {
      if (!resolvedConfigPath || resolvedConfigPath !== file) return undefined;
      if (verbose) console.log(`🔄 Theme config changed: ${file}`);
      backgroundRefreshPending = false;
      markThemeDirty();
      await loadTheme(true);
      server.ws.send({ type: 'full-reload', path: '*' });
      return [];
    },
  };
}

export default udixio;
