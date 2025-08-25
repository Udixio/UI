#!/usr/bin/env node
import { createJiti } from 'jiti';
import chokidar from 'chokidar';
import mri from 'mri';
import { fileURLToPath } from 'node:url';
import { dirname, resolve as resolvePath } from 'pathe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jiti = createJiti(__filename, { interopDefault: true });

async function runOnce(configPath) {
  const { UniversalAdapter } = await jiti.import(
    resolvePath(__dirname, '../src/adapters/universal.adapter.ts'),
  );
  const adapter = new UniversalAdapter(configPath);
  await adapter.init();
  adapter.load();
}

async function main() {
  const args = mri(process.argv.slice(2));
  const cmd = args._[0] || 'build';
  const configPath = args.config || './theme.config';

  if (cmd === 'build') {
    await runOnce(configPath);
    return;
  }

  if (cmd === 'dev') {
    if (args.watch) {
      await runOnce(configPath);
      const exts = ['.ts', '.js', '.mjs', '.cjs'];
      const base = String(configPath).replace(/\.(ts|js|mjs|cjs)$/i, '');
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
