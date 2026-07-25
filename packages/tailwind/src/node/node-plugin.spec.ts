import { describe, expect, it } from 'vitest';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { defineConfig, FontPlugin, loader } from '@udixio/theme';
import { TailwindPlugin } from './tailwind.plugin';

describe('node TailwindPlugin', () => {
  it('writes udixio.generated.css and gitignores it, without touching other CSS', async () => {
    const root = join(__dirname, '..', '..', '.tmp-test');
    mkdirSync(root, { recursive: true });
    const dir = mkdtempSync(join(root, 'node-'));
    try {
      const userCss = join(dir, 'global.css');
      writeFileSync(userCss, '@import "tailwindcss";\n');
      const outFile = join(dir, 'udixio.generated.css');

      const config = defineConfig({
        sourceColor: '#6750A4',
        plugins: [new FontPlugin({}), new TailwindPlugin({ outFile })],
      });
      const api = await loader(config, false);
      await api.load();

      expect(existsSync(outFile)).toBe(true);
      expect(readFileSync(outFile, 'utf8')).toContain('--color-primary:');
      // user CSS untouched
      expect(readFileSync(userCss, 'utf8')).toBe('@import "tailwindcss";\n');
      // gitignore updated
      expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toContain(
        'udixio.generated.css',
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
