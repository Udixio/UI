import { createUnplugin } from 'unplugin';
import { loadFromPath } from './load-from-path';

export interface UdixioThemeOptions {
  configPath?: string;
  verbose?: boolean;
}

export const unpluginUdixioTheme = createUnplugin<UdixioThemeOptions>(
  (options = {}) => {
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
      buildStart: async () => {
        await loadTheme();
      },

      // Hook appelé pendant la génération (Rollup/Vite)
      generateBundle: async () => {
        await loadTheme();
      },

      // Support spécifique Vite pour HMR
      vite: {
        handleHotUpdate: async ({ server, file, modules }) => {
          if (!resolvedConfigPath) {
            const result = await loadFromPath(configPath);
            resolvedConfigPath = result?.filePath || '';
          }

          if (resolvedConfigPath === file) {
            if (verbose) {
              console.log(`🔄 Theme config changed: ${file}`);
            }
            await loadTheme();
            server.ws.send({ type: 'full-reload', path: '*' });
            return modules;
          }
          return;
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
  },
);

// Exports pour chaque bundler
export const vitePlugin = unpluginUdixioTheme.vite;
export const webpackPlugin = unpluginUdixioTheme.webpack;
export const rollupPlugin = unpluginUdixioTheme.rollup;
export const esbuildPlugin = unpluginUdixioTheme.esbuild;

// Export par défaut (garde la compatibilité avec l'ancien code)
export default unpluginUdixioTheme;
