import type { UdixioVitePlugin } from './plugin';

/**
 * The plugin's hooks as the plain functions `udixio()` defines them, for
 * calling them directly: Vite types each hook as function-or-object.
 */
export interface Hooks {
  resolveId(id: string, importer?: string): Promise<string | null>;
  load(id: string): Promise<string | null>;
  buildStart(this: { addWatchFile(id: string): void }): Promise<void>;
}

export const hooks = (plugin: UdixioVitePlugin): Hooks =>
  plugin as unknown as Hooks;
