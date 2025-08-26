import { ConfigInterface } from './config.interface';
import * as fs from 'node:fs';

export interface ResolvedConfigResult {
  config: ConfigInterface;
  filePath: string; // absolute path of the loaded config file
}

/**
 * Resolve and load theme.config.{ts,js,mjs,cjs} using JITI, independent of any bundler.
 * @param configPath base path without extension or full path with/without extension
 */
export async function resolveConfig(
  configPath = './theme.config',
): Promise<ResolvedConfigResult> {
  const { createJiti } = await import('jiti');
  const { resolve } = await import('pathe');

  const jiti = createJiti(import.meta.url, {
    debug: process.env.NODE_ENV === 'development',
    fsCache: true,
    interopDefault: true,
  });

  // If user passed a path with extension, try it as-is first
  const tryPaths: string[] = [];
  const resolvedInput = resolve(configPath);

  const extMatch = /\.(ts|js|mjs|cjs)$/.exec(resolvedInput);
  if (extMatch) {
    tryPaths.push(resolvedInput);
  } else {
    for (const ext of ['.ts', '.js', '.mjs', '.cjs']) {
      tryPaths.push(resolvedInput + ext);
    }
  }

  for (const file of tryPaths) {
    if (fs.existsSync(file)) {
      const cfg = (await jiti.import(file, {
        default: true,
      })) as ConfigInterface;

      return { config: cfg, filePath: file };
    }
  }

  throw new Error(`Configuration file not found for ${''}{.ts,.js,.mjs,.cjs}`);
}
