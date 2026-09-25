import type { UnpluginInstance } from 'unplugin';
import {
  resolveConfig,
  resolveConfigPath,
  type ResolvedConfigResult,
} from '../config/resolver-config';
import {
  getThemeBuildArtifacts,
  hasCachedThemeBuildArtifacts,
} from './build-artifact';

export interface UdixioThemeOptions {
  configPath?: string;
  verbose?: boolean;
}

// Lazily loaded instance
let unpluginInstance: UnpluginInstance<UdixioThemeOptions> | null = null;

const createUnpluginTheme = async () => {
  if (unpluginInstance) {
    return unpluginInstance;
  }

  const { createUnplugin } = await import('unplugin');

  unpluginInstance = createUnplugin<UdixioThemeOptions>((options = {}) => {
    const { configPath = './theme.config', verbose = false } = options;

    let resolvedConfigPath: string | undefined;
    let resolvingConfigPath: Promise<string> | undefined;
    let resolvedConfig: ResolvedConfigResult | undefined;
    let resolvingConfig: Promise<ResolvedConfigResult> | undefined;
    let loadingTheme: Promise<void> | undefined;
    let themeNeedsReload = true;
    let themeRevision = 0;
    let themeHasLoaded = false;

    // Skip during Nx graph creation
    // NX_GRAPH_CREATION is set on the global by Nx, outside of any typing.
    if ((globalThis as Record<string, unknown>)['NX_GRAPH_CREATION']) {
      return {
        name: 'udixio-theme',
      };
    }

    const getConfigPath = async (): Promise<string> => {
      if (resolvedConfigPath) {
        return resolvedConfigPath;
      }

      resolvingConfigPath ??= resolveConfigPath(configPath).then((filePath) => {
        resolvedConfigPath = filePath;
        return filePath;
      });

      try {
        return await resolvingConfigPath;
      } finally {
        resolvingConfigPath = undefined;
      }
    };

    const getResolvedConfig = async (): Promise<ResolvedConfigResult> => {
      if (resolvedConfig) {
        return resolvedConfig;
      }

      resolvingConfig ??= resolveConfig(configPath).then((result) => {
        resolvedConfig = result;
        resolvedConfigPath = result.filePath;
        return result;
      });

      try {
        return await resolvingConfig;
      } finally {
        resolvingConfig = undefined;
      }
    };

    const markThemeDirty = () => {
      themeNeedsReload = true;
      themeRevision += 1;
      resolvedConfig = undefined;
    };

    const loadTheme = async (
      initialConfig?: ResolvedConfigResult,
    ): Promise<void> => {
      if (loadingTheme) {
        return loadingTheme;
      }

      loadingTheme = (async () => {
        try {
          let config = initialConfig;

          do {
            const revisionBeingLoaded = themeRevision;
            config ??= await getResolvedConfig();

            if (verbose) {
              console.log(`🎨 Loading theme from: ${configPath}`);
            }
            // Keep the expensive theme engine and the user's config out of the
            // plugin import path. A cached generated artifact lets the first
            // build continue while this work happens in the background.
            const { loadFromPath } = await import('./load-from-path');
            await loadFromPath(configPath, config);
            config = undefined;

            // A config can change while an async load is in progress. Keep the
            // loop alive so the next build always observes the newest theme.
            if (themeRevision === revisionBeingLoaded) {
              themeNeedsReload = false;
              themeHasLoaded = true;
            }
            if (verbose) {
              console.log(`✅ Theme loaded successfully!`);
            }
          } while (themeNeedsReload);
        } catch (error) {
          // Keep the dirty flag set so a subsequent build can retry after a
          // transient config/import error.
          themeNeedsReload = true;
          console.error(`❌ Theme loading failed:`, error);
          throw error;
        } finally {
          loadingTheme = undefined;
        }
      })();

      return loadingTheme;
    };

    return {
      name: 'udixio-theme',

      // Hook called at build start (all bundlers)
      buildStart: async function () {
        const config = await getResolvedConfig();
        for (const artifact of getThemeBuildArtifacts(config.config)) {
          this.addWatchFile(artifact.path);
        }

        if (themeNeedsReload) {
          const isInitialLoad = !themeHasLoaded && themeRevision === 0;

          if (isInitialLoad) {
            if (hasCachedThemeBuildArtifacts(config.config)) {
              // The generated CSS is already available to the bundler. Do not
              // keep Vite/Rollup waiting for the theme engine on a warm start.
              // A config change is handled synchronously by the HMR/watch hooks.
              void loadTheme(config).catch(() => undefined);
            } else {
              await loadTheme(config);
            }
          } else {
            // Once a theme has been invalidated, the current build must wait
            // for the fresh artifact so watch mode remains deterministic.
            await loadTheme();
          }
        }
        // Tell the bundler (Rollup/Vite) to watch the config file
        this.addWatchFile(await getConfigPath());
      },

      // Vite-specific HMR support
      vite: {
        configureServer: async (server) => {
          // Only resolve the path here. Loading the config bootstraps the
          // complete colour engine and belongs to buildStart.
          server.watcher.add(await getConfigPath());
        },

        handleHotUpdate: async ({ server, file }) => {
          if (resolvedConfigPath && resolvedConfigPath === file) {
            if (verbose) {
              console.log(`🔄 Theme config changed: ${file}`);
            }
            markThemeDirty();
            await loadTheme();
            server.ws.send({ type: 'full-reload', path: '*' });
            // Return [] to stop the default HMR handling
            return [];
          }
          // Otherwise, let Vite apply its default HMR handling.
          return undefined;
        },
      },

      // Webpack-specific HMR support
      webpack: (compiler) => {
        if (compiler.options.mode === 'development') {
          compiler.hooks.watchRun.tapAsync(
            'udixio-theme',
            async (compilation, callback) => {
              const changedFiles = compilation.modifiedFiles || new Set();

              const configFilePath = await getConfigPath();

              if (changedFiles.has(configFilePath)) {
                if (verbose) {
                  console.log(`🔄 Theme config changed: ${configFilePath}`);
                }
                markThemeDirty();
                await loadTheme();
              }
              callback();
            },
          );
        }
      },

      // Rollup-specific support
      rollup: {
        watchChange: async (id) => {
          await getConfigPath();

          if (resolvedConfigPath === id) {
            if (verbose) {
              console.log(`🔄 Theme config changed: ${id}`);
            }
            // Rollup calls buildStart immediately after watchChange. Marking
            // the theme dirty there avoids doing the expensive work twice.
            markThemeDirty();
          }
        },
      },
    };
  });

  return unpluginInstance;
};

// Lazily loaded exports
export const vitePlugin = async (options?: UdixioThemeOptions) => {
  const plugin = await createUnpluginTheme();
  return plugin.vite(options ?? {});
};

export const webpackPlugin = async (options?: UdixioThemeOptions) => {
  const plugin = await createUnpluginTheme();
  return plugin.webpack(options ?? {});
};

export const rollupPlugin = async (options?: UdixioThemeOptions) => {
  const plugin = await createUnpluginTheme();
  return plugin.rollup(options ?? {});
};

export const esbuildPlugin = async (options?: UdixioThemeOptions) => {
  const plugin = await createUnpluginTheme();
  return plugin.esbuild(options ?? {});
};

// Main export, lazily loaded
export const unpluginUdixioTheme = {
  vite: vitePlugin,
  webpack: webpackPlugin,
  rollup: rollupPlugin,
  esbuild: esbuildPlugin,
};

// Default export
export default unpluginUdixioTheme;
