import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vitePlugin from '../src/vite.js';
import rollupPlugin from '../src/rollup.js';

const temporaryDirectories: string[] = [];

type PluginHooks = {
  configureServer(server: {
    watcher: { add(id: string): void };
  }): Promise<void>;
  buildStart(this: { addWatchFile(id: string): void }): Promise<void>;
  watchChange(id: string): Promise<void>;
  handleHotUpdate(args: {
    server: { ws: { send(message: unknown): void } };
    file: string;
  }): Promise<unknown>;
  generateBundle?: unknown;
};

const hooks = (plugin: unknown) => plugin as PluginHooks;

function themeConfig(contents: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'udixio-theme-plugin-'));
  temporaryDirectories.push(directory);
  const filePath = join(directory, 'theme.config.ts');
  writeFileSync(filePath, contents);
  return filePath;
}

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();
    if (directory) {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

describe('bundler adapters', () => {
  it('registers the Vite watcher without importing the theme config', async () => {
    const filePath = themeConfig(
      "throw new Error('the config must not be imported by configureServer');",
    );
    const watched: string[] = [];
    const plugin = await vitePlugin({ configPath: filePath });

    await hooks(plugin).configureServer({
      watcher: {
        add: (id: string) => watched.push(id),
      },
    });

    expect(watched).toEqual([filePath]);
    expect(hooks(plugin)).not.toHaveProperty('generateBundle');
  });

  it('reloads Rollup only after the watched config changes', async () => {
    const filePath = themeConfig("export default { sourceColor: '#6750A4' };");
    const plugin = await rollupPlugin({ configPath: filePath });
    const context = { addWatchFile: vi.fn() };

    await hooks(plugin).buildStart.call(context);
    writeFileSync(
      filePath,
      "throw new Error('unchanged builds must not reload the config');",
    );

    // A rebuild caused by another source file does not need to regenerate the
    // theme. The invalid config proves that no import happened here.
    await hooks(plugin).buildStart.call(context);

    await hooks(plugin).watchChange(filePath);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    try {
      await expect(hooks(plugin).buildStart.call(context)).rejects.toThrow(
        'unchanged builds must not reload the config',
      );
    } finally {
      consoleError.mockRestore();
    }
    expect(context.addWatchFile).toHaveBeenCalledWith(filePath);
  });

  it('reloads the theme and triggers a full Vite update', async () => {
    const filePath = themeConfig("export default { sourceColor: '#6750A4' };");
    const plugin = await vitePlugin({ configPath: filePath });
    const context = { addWatchFile: vi.fn() };
    const messages: unknown[] = [];

    await hooks(plugin).configureServer({ watcher: { add: vi.fn() } });
    await hooks(plugin).buildStart.call(context);
    writeFileSync(filePath, "export default { sourceColor: '#B3261E' };");

    await expect(
      hooks(plugin).handleHotUpdate({
        server: { ws: { send: (message) => messages.push(message) } },
        file: filePath,
      }),
    ).resolves.toEqual([]);

    expect(messages).toEqual([{ type: 'full-reload', path: '*' }]);
  });
});
