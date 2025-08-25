#!/usr/bin/env node
import { UniversalAdapter } from '../src/adapters/universal.adapter';
import chokidar from 'chokidar';
import mri from 'mri';

async function runOnce(configPath: string) {
  const adapter = new UniversalAdapter(configPath);
  await adapter.init();
  adapter.load();
}

async function main() {
  const args = mri(process.argv.slice(2));
  const cmd = args._[0] || 'build';
  const configPath = (args.config as string) || './theme.config';

  if (cmd === 'build') {
    await runOnce(configPath);
    return;
  }

  if (cmd === 'dev') {
    if (args.watch) {
      await runOnce(configPath);
      const exts = ['.ts', '.js', '.mjs', '.cjs'];
      const base = configPath.replace(/\.(ts|js|mjs|cjs)$/i, '');
      const files = exts.map((e) => base + e);
      const watcher = chokidar.watch(files, { ignoreInitial: true });
      watcher.on('change', async () => {
        await runOnce(configPath);
      });
    } else {
      await runOnce(configPath);
    }
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
