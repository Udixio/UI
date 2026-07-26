import { describe, expect, it } from 'vitest';
import { buildResolvedCss, generateReferenceCss } from './test-utils';

/**
 * Regression guard for named state groups. Components mark their root as a
 * NAMED group (e.g. `group/button` in button.style.ts) and the state layer uses
 * `state-ripple-group-[button]`, which must scope its hover/active/focus rules
 * to `group-hover/button:` etc. A named group does NOT respond to the bare
 * `group-hover:` variant, so if the scoping is lost the state layer is dead.
 *
 * The old plugin generated these via `matchUtilities` (arbitrary values). The
 * static-CSS refactor briefly broke this by emitting a non-functional
 * `@utility state-ripple-group` that could not match the `-[name]` form.
 */
describe('named state groups resolve with the correct group scope', () => {
  it('state-ripple-group-[button] emits rules scoped to the /button group', async () => {
    const generated = await generateReferenceCss();
    const resolved = await buildResolvedCss(generated, [
      'state-ripple-group-[button]',
    ]);
    // must be scoped to the named group `/button`, not the bare group
    expect(resolved).toMatch(/group\\?\/button/);
    expect(resolved).toContain('var(--state-color)');
  });

  it('state-group-[card] emits rules scoped to the /card group', async () => {
    const generated = await generateReferenceCss();
    const resolved = await buildResolvedCss(generated, ['state-group-[card]']);
    expect(resolved).toMatch(/group\\?\/card/);
  });
});
