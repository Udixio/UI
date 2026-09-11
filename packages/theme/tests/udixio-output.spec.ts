/**
 * Drift guard for the custom `udixio` variant.
 *
 * It has no upstream counterpart, so conformance cannot cover it, and the
 * invariants only pin down structural properties. What is left to protect is
 * that its output does not move by accident — which is a live risk, because it
 * shares the resolver, the contrast curves and the tone delta pairs with the
 * standard variants. A fix aimed at spec conformance can shift it silently.
 *
 * A failure here is not automatically a bug. It means: the colours changed,
 * say whether you meant it. If you did, `vitest -u` records the new output.
 */
import { describe, expect, it } from 'vitest';

import { buildGrid } from './helpers/grid.js';

const BUILD_TIMEOUT = 180_000;

describe('udixio variant output', () => {
  it(
    'stays stable across the grid',
    async () => {
      const grid = await buildGrid(['Udixio']);

      // Sorted for a stable, reviewable diff.
      const stable = Object.fromEntries(
        Object.entries(grid)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, snapshot]) => [
            key,
            {
              palettes: Object.fromEntries(
                Object.entries(snapshot.palettes).sort(([a], [b]) =>
                  a.localeCompare(b),
                ),
              ),
              colors: Object.fromEntries(
                Object.entries(snapshot.colors).sort(([a], [b]) =>
                  a.localeCompare(b),
                ),
              ),
            },
          ]),
      );

      expect(stable).toMatchSnapshot();
    },
    BUILD_TIMEOUT,
  );
});
