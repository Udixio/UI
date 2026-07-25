import { describe, expect, it } from 'vitest';
import { buildResolvedCss, generateReferenceCss, GOLDEN_CANDIDATES } from './test-utils';

describe('new emitter equivalence', () => {
  it('resolved CSS matches the characterization golden', async () => {
    const generated = await generateReferenceCss();
    const resolved = await buildResolvedCss(generated, GOLDEN_CANDIDATES);
    expect(resolved).toMatchSnapshot();
  });
});
