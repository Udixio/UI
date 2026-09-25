import type { ConfigInterface } from './index';
import * as fs from 'node:fs';

const CONFIG_EXTENSIONS = ['.ts', '.js', '.mjs', '.cjs'] as const;

export interface ResolvedConfigResult {
  config: ConfigInterface;
  filePath: string; // absolute path of the loaded config file
}

/**
 * Resolve the configuration file without importing it.
 *
 * The bundler adapters use this to register the file with their watcher. It
 * must stay separate from `resolveConfig`: resolving a path is cheap, while
 * importing the config and bootstrapping a theme is deliberately deferred
 * until a build actually needs it.
 */
export async function resolveConfigPath(
  configPath = './theme.config',
): Promise<string> {
  const { resolve } = await import('pathe');
  const resolvedInput = resolve(configPath);
  const extMatch = /\.(ts|js|mjs|cjs)$/.exec(resolvedInput);
  const tryPaths = extMatch
    ? [resolvedInput]
    : CONFIG_EXTENSIONS.map((extension) => resolvedInput + extension);

  for (const file of tryPaths) {
    if (fs.existsSync(file)) {
      return file;
    }
  }

  throw new Error(
    `Configuration file not found for ${resolvedInput} (tried ${CONFIG_EXTENSIONS.join(', ')})`,
  );
}

/**
 * Resolve and load theme.config.{ts,js,mjs,cjs} using JITI, independent of any bundler.
 * @param configPath base path without extension or full path with/without extension
 */
export async function resolveConfig(
  configPath = './theme.config',
): Promise<ResolvedConfigResult> {
  const { createJiti } = await import('jiti');

  const jiti = createJiti(import.meta.url, {
    debug: process.env.NODE_ENV === 'development',
    // fsCache in prod only — in dev, always re-read the fresh file
    fsCache: process.env.NODE_ENV !== 'development',
    // No in-memory cache between calls (watch)
    moduleCache: false,
    interopDefault: true,
  });

  const filePath = await resolveConfigPath(configPath);
  const config = (await jiti.import(filePath, {
    default: true,
  })) as ConfigInterface;

  return { config, filePath };
}
