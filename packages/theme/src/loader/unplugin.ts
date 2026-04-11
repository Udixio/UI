import { loadFromPath } from './load-from-path';

export interface UdixioThemeOptions {
  configPath?: string;
  verbose?: boolean;
}

// Instance lazy-loadée
let unpluginInstance: any = null;

const createUnpluginTheme = async () => {
  if (unpluginInstance) {
    return unpluginInstance;
  }

  const { createUnplugin } = await import('unplugin');

  unpluginInstance = createUnplugin<UdixioThemeOptions>((options = {}) => {
    const { configPath = './theme.config', verbose = false } = options;

    let resolvedConfigPath: string;

    // Skip pendant la génération du graph NX
    if (global.NX_GRAPH_CREATION) {
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

      // Hook appelé au début du build (tous les bundlers)
      buildStart: async function () {
        await loadTheme();
        // Indique au bundler (Rollup/Vite) de surveiller le fichier config
        if (resolvedConfigPath) {
          this.addWatchFile(resolvedConfigPath);
        }
      },

      // Hook appelé pendant la génération (Rollup/Vite)
      generateBundle: async () => {
        await loadTheme();
      },

      // Support spécifique Vite pour HMR
      vite: {
        configureServer: async (server) => {
          // Résoudre le chemin du config si pas encore fait
          if (!resolvedConfigPath) {
            const result = await loadFromPath(configPath);
            resolvedConfigPath = result?.filePath || '';
          }
          // Enregistrer explicitement le fichier config dans le watcher de Vite
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
            // Retourner [] pour stopper le traitement HMR par défaut
            return [];
          }
        },
      },

      // Support spécifique Webpack pour HMR
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

      // Support spécifique Rollup
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

// Exports avec lazy loading
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

// Export principal avec lazy loading
export const unpluginUdixioTheme = {
  vite: vitePlugin,
  webpack: webpackPlugin,
  rollup: rollupPlugin,
  esbuild: esbuildPlugin,
};

// Export par défaut
export default unpluginUdixioTheme;
