import type { UnpluginInstance } from 'unplugin';
import { resolveConfigPath } from '../config/resolver-config';

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
    let loadingTheme: Promise<void> | undefined;
    let themeNeedsReload = true;
    let themeRevision = 0;

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

    const markThemeDirty = () => {
      themeNeedsReload = true;
      themeRevision += 1;
    };

    const loadTheme = async (): Promise<void> => {
      if (loadingTheme) {
        return loadingTheme;
      }

      const revisionBeingLoaded = themeRevision;
      loadingTheme = (async () => {
        try {
          if (verbose) {
            console.log(`🎨 Loading theme from: ${configPath}`);
          }
          // Keep the expensive theme engine and the user's config out of the
          // plugin import path. The first build (or a real config change)
          // loads them on demand.
          const { loadFromPath } = await import('./load-from-path');
          const result = await loadFromPath(configPath);
          if (!resolvedConfigPath && result?.filePath) {
            resolvedConfigPath = result.filePath;
          }
          // A config can change while an async import is in progress. Do not
          // clear the dirty flag for that newer revision.
          if (themeRevision === revisionBeingLoaded) {
            themeNeedsReload = false;
          }
          if (verbose) {
            console.log(`✅ Theme loaded successfully!`);
          }
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
        if (themeNeedsReload) {
          await loadTheme();
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
