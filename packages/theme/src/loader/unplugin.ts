import { loadFromPath } from './load-from-path';

export interface UdixioThemeOptions {
  configPath?: string;
  verbose?: boolean;
}

// Lazily loaded instance
let unpluginInstance: any = null;

const createUnpluginTheme = async () => {
  if (unpluginInstance) {
    return unpluginInstance;
  }

  const { createUnplugin } = await import('unplugin');

  unpluginInstance = createUnplugin<UdixioThemeOptions>((options = {}) => {
    const { configPath = './theme.config', verbose = false } = options;

    let resolvedConfigPath: string;

    // Skip during Nx graph creation
    // NX_GRAPH_CREATION is set on the global by Nx, outside of any typing.
    if ((globalThis as Record<string, unknown>)['NX_GRAPH_CREATION']) {
      return {
        name: 'udixio-theme',
      };
    }

    const loadTheme = async (): Promise<void> => {
      try {
        if (verbose) {
          console.log(`🎨 Loading theme from: ${configPath}`);
        }
        const result = await loadFromPath(configPath);
        if (!resolvedConfigPath && result?.filePath) {
          resolvedConfigPath = result.filePath;
        }
        if (verbose) {
          console.log(`✅ Theme loaded successfully!`);
        }
      } catch (error) {
        console.error(`❌ Theme loading failed:`, error);
        throw error;
      }
    };

    return {
      name: 'udixio-theme',

      // Hook called at build start (all bundlers)
      buildStart: async function () {
        await loadTheme();
        // Tell the bundler (Rollup/Vite) to watch the config file
        if (resolvedConfigPath) {
          this.addWatchFile(resolvedConfigPath);
        }
      },

      // Hook called during bundle generation (Rollup/Vite)
      generateBundle: async () => {
        await loadTheme();
      },

      // Vite-specific HMR support
      vite: {
        configureServer: async (server) => {
          // Resolve the config path if not done yet
          if (!resolvedConfigPath) {
            const result = await loadFromPath(configPath);
            resolvedConfigPath = result?.filePath || '';
          }
          // Explicitly register the config file in Vite's watcher
          if (resolvedConfigPath) {
            server.watcher.add(resolvedConfigPath);
          }
        },

        handleHotUpdate: async ({ server, file }) => {
          if (resolvedConfigPath && resolvedConfigPath === file) {
            if (verbose) {
              console.log(`🔄 Theme config changed: ${file}`);
            }
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

              if (!resolvedConfigPath) {
                const result = await loadFromPath(configPath);
                resolvedConfigPath = result?.filePath || '';
              }

              if (changedFiles.has(resolvedConfigPath)) {
                if (verbose) {
                  console.log(`🔄 Theme config changed: ${resolvedConfigPath}`);
                }
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
          if (!resolvedConfigPath) {
            const result = await loadFromPath(configPath);
            resolvedConfigPath = result?.filePath || '';
          }

          if (resolvedConfigPath === id) {
            if (verbose) {
              console.log(`🔄 Theme config changed: ${id}`);
            }
            await loadTheme();
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
  return plugin.vite(options);
};

export const webpackPlugin = async (options?: UdixioThemeOptions) => {
  const plugin = await createUnpluginTheme();
  return plugin.webpack(options);
};

export const rollupPlugin = async (options?: UdixioThemeOptions) => {
  const plugin = await createUnpluginTheme();
  return plugin.rollup(options);
};

export const esbuildPlugin = async (options?: UdixioThemeOptions) => {
  const plugin = await createUnpluginTheme();
  return plugin.esbuild(options);
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
