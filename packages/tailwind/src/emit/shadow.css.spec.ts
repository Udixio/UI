import { describe, expect, it } from 'vitest';
import { buildResolvedCss } from './test-utils';
import { shadowCss } from './shadow.css';

describe('shadowCss', () => {
  it('emits shadow utilities that resolve and support variants', async () => {
    const resolved = await buildResolvedCss(shadowCss(), [
      'shadow-1',
      'hover:shadow-2',
    ]);
    // base utility resolves with the exact Material box-shadow
    expect(resolved).toMatch(/\.shadow-1\s*\{/);
    expect(resolved).toContain(
      '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
    );
    // variant resolves (escaped class selector present)
    expect(resolved).toContain('.hover\\:shadow-2');
    expect(resolved).toContain(
      '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
    );
  });
});
