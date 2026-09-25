import { FontPlugin, PluginAbstract } from '@udixio/theme';
import type { ThemeBuildArtifact } from '@udixio/theme';

import {
  TailwindImplPluginBrowser,
  TailwindPluginOptions as TailwindPluginBrowserOptions,
} from '../browser/tailwind.plugin';
import { resolve } from 'node:path';

export type TailwindPluginOptions = TailwindPluginBrowserOptions;

export class TailwindPlugin extends PluginAbstract<
  TailwindImplPlugin,
  TailwindPluginOptions
> {
  public dependencies = [FontPlugin];
  public name = 'tailwind';
  pluginClass = TailwindImplPlugin;

  override getBuildArtifacts(): readonly ThemeBuildArtifact[] {
    return [
      {
        kind: 'css',
        path: resolve(this.options.outFile ?? 'udixio.generated.css'),
      },
    ];
  }
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
    const { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } =
      await import('node:fs');

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
    // Replace the artifact atomically so a concurrent Vite read sees either
    // the previous complete stylesheet or the new complete stylesheet.
    const temporaryFile = `${outFile}.tmp-${process.pid}`;
    writeFileSync(temporaryFile, this.outputCss);
    renameSync(temporaryFile, outFile);

    // Ensure the generated file is gitignored (idempotent).
    const gitignore = join(dir, '.gitignore');
    const base = outFile.slice(dir.length + 1);
    const current = existsSync(gitignore)
      ? readFileSync(gitignore, 'utf8')
      : '';
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
