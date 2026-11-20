import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';
import { main } from '../main';

const tailwindDir = dirname(
  createRequire(import.meta.url).resolve('tailwindcss/index.css'),
);

/**
 * Compiles `@plugin "@udixio/tailwind"` with the source plugin, not the built
 * dist, so the spec sees the utilities as they are written, and returns the CSS
 * for the candidates.
 */
async function build(candidates: string[]): Promise<string> {
  const compiled = await compile(
    '@import "tailwindcss";\n@plugin "@udixio/tailwind";',
    {
      base: tailwindDir,
      loadStylesheet: async (id, base) => {
        const path =
          id === 'tailwindcss'
            ? join(tailwindDir, 'index.css')
            : id.startsWith('.')
              ? join(base, id)
              : join(tailwindDir, id.replace(/^tailwindcss\//, ''));
        return {
          path,
          base: dirname(path),
          content: readFileSync(path, 'utf8'),
        };
      },
      loadModule: async (id, base) => {
        if (id !== '@udixio/tailwind')
          throw new Error(`Unexpected plugin ${id}`);
        return { path: id, base, module: main };
      },
    },
  );
  return compiled.build(candidates);
}

describe('motion-[name] and motion-none', () => {
  it('sets --udx-motion to the named motion', async () => {
    const css = await build(['motion-[fade-on-view]']);
    expect(css).toMatch(
      /\.motion-\\\[fade-on-view\\\]\s*\{\s*--udx-motion: fade-on-view;/,
    );
  });

  it('sets --udx-motion to none', async () => {
    const css = await build(['motion-none']);
    expect(css).toMatch(/\.motion-none\s*\{\s*--udx-motion: none;/);
  });

  it('applies under a breakpoint variant', async () => {
    const css = await build(['md:motion-[fade]']);
    expect(css).toMatch(
      /@media \(width >= 48rem\)\s*\{\s*\.md\\:motion-\\\[fade\\\]\s*\{\s*--udx-motion: fade;/,
    );
  });

  it('applies under a state variant', async () => {
    const css = await build(['hover:motion-none']);
    expect(css).toMatch(
      /\.hover\\:motion-none:hover\s*\{\s*--udx-motion: none;/,
    );
  });

  it('takes only the bracketed or none form, a bare name is not a utility', async () => {
    const css = await build(['motion-fade']);
    expect(css).not.toContain('--udx-motion');
  });

  it('leaves motion-reduce and motion-safe to Tailwind variants', async () => {
    const css = await build([
      'motion-reduce:transition-none',
      'motion-safe:transition-none',
      'motion-reduce',
    ]);
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('prefers-reduced-motion: no-preference');
    expect(css).not.toContain('--udx-motion');
  });
});
