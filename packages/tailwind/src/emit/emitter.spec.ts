import { describe, expect, it } from 'vitest';
import { generateReferenceCss } from './test-utils';

describe('theme CSS emitter', () => {
  it('emits @theme colors, font, state, shadow and the animation @plugin line', async () => {
    const css = await generateReferenceCss();
    expect(css).toContain('@theme');                      // colors registered as theme
    expect(css).toContain('--color-primary:');            // colors
    expect(css).toContain('@utility text-display-large'); // font (static)
    expect(css).toContain('@utility state-primary');      // state (static)
    expect(css).toContain('@utility shadow-1');            // shadow (static)
    expect(css).toContain('@plugin "@udixio/tailwind"');  // animation
    // the old string round-trip block must be gone
    expect(css).not.toContain('colorKeys:');
  });
});
