import { describe, expect, it } from 'vitest';
import { buildResolvedCss, generateReferenceCss, GOLDEN_CANDIDATES } from './test-utils';

describe('current @udixio/tailwind resolved CSS (characterization)', () => {
  it('golden resolved utilities + color vars for the reference config', async () => {
    const generated = await generateReferenceCss();
    const resolved = await buildResolvedCss(generated, GOLDEN_CANDIDATES);
    expect(resolved).toMatchSnapshot();
  });
});
