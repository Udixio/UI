import { describe, expect, it } from 'vitest';
import { defineConfig, generateStaticThemeCss } from './index.browser';

describe('browser entry', () => {
  it('generates the static theme CSS from a browser-build config', async () => {
    const css = await generateStaticThemeCss(
      defineConfig({ sourceColor: '#6750A4' }),
    );
    expect(css).toContain('@theme {');
    expect(css).toContain('--color-primary:');
    expect(css).toContain('@plugin "@udixio/tailwind";');
  });
});
