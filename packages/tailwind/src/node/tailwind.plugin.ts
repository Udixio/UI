import { FontPlugin, PluginAbstract } from '@udixio/theme';

import {
  TailwindImplPluginBrowser,
  TailwindPluginOptions as TailwindPluginBrowserOptions,
} from '../browser/tailwind.plugin';

export type TailwindPluginOptions = TailwindPluginBrowserOptions;

export class TailwindPlugin extends PluginAbstract<
  TailwindImplPlugin,
  TailwindPluginOptions
> {
  public dependencies = [FontPlugin];
  public name = 'tailwind';
  pluginClass = TailwindImplPlugin;
}

// Deduplication: only one concurrent file-write per process
let nodeOnLoadPromise: Promise<void> | null = null;

class TailwindImplPlugin extends TailwindImplPluginBrowser {
  private isNodeJs(): boolean {
    return (
      typeof process !== 'undefined' &&
      process.versions != null &&
      process.versions.node != null
    );
  }

  override async onLoad() {
    this.outputCss = '';
    if (!this.isNodeJs() || this.options.ssr) {
      await super.onLoad();
      return;
    }

    // If another instance is already writing, wait for it and skip our own write
    if (nodeOnLoadPromise) {
      await nodeOnLoadPromise;
      return;
    }
    nodeOnLoadPromise = this._doNodeLoad();
    try {
      await nodeOnLoadPromise;
    } finally {
      nodeOnLoadPromise = null;
    }
  }

  private async _doNodeLoad() {
    const { dirname, isAbsolute, join, resolve } = await import('pathe');
    const { existsSync, readFileSync, writeFileSync, mkdirSync } = await import(
      'node:fs'
    );

    // Full static CSS via the shared emitter (colors + font + state + shadow + @plugin).
    this.emitStaticCss();

    const cwd = resolve();
    const outFile = this.options.outFile
      ? isAbsolute(this.options.outFile)
        ? this.options.outFile
        : join(cwd, this.options.outFile)
      : join(cwd, 'udixio.generated.css');

    const dir = dirname(outFile);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(outFile, this.outputCss);

    // Ensure the generated file is gitignored (idempotent).
    const gitignore = join(dir, '.gitignore');
    const base = outFile.slice(dir.length + 1);
    const current = existsSync(gitignore) ? readFileSync(gitignore, 'utf8') : '';
    if (!current.split(/\r?\n/).includes(base)) {
      writeFileSync(
        gitignore,
        (current && !current.endsWith('\n') ? current + '\n' : current) +
          base +
          '\n',
      );
    }
  }
}
