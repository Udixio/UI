import { describe, expect, it } from 'vitest';
import { buildResolvedCss } from './test-utils';
import { stateCss } from './state.css';

// stateCss composes with the theme colors: its disabled `@apply text-on-surface`
// / `bg-on-surface` require those color utilities to exist, which happens via
// the `@theme` block the real emitter (Task 6) emits alongside stateCss. Supply
// a minimal @theme here to reproduce that composition.
const THEME = `@theme {
  --color-on-surface: #1c1b1f;
  --color-primary: #6750a4;
  --color-secondary: #625b71;
}`;

describe('stateCss', () => {
  it('emits state-layer, state-group and per-color state utilities', async () => {
    const css = THEME + '\n' + stateCss(['primary', 'secondary']);
    const resolved = await buildResolvedCss(css, [
      'state-layer',
      'state-primary',
      'state-group',
    ]);
    expect(resolved).toMatch(/\.state-primary\s*\{/);
    expect(resolved).toContain('--state-color: var(--color-primary)');
    expect(resolved).toMatch(/\.state-layer\s*\{/);
    // the @apply bodies resolved into real declarations referencing the token
    expect(resolved).toContain('transition-property');
    expect(resolved).toContain('var(--state-color)');
  });
});
