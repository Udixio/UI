/**
 * Drift guards for the standard variants.
 *
 * The conformance fixture checks that these variants follow Material's
 * standard output. These snapshots additionally keep the complete output
 * reviewable, including every palette and every semantic role over the shared
 * theme grid.
 */
import { describe, expect, it } from 'vitest';

import {
  buildGrid,
  STANDARD_VARIANTS,
  type GridSnapshot,
} from './helpers/grid.js';

const BUILD_TIMEOUT = 180_000;

/** Sorts every level so snapshot diffs stay deterministic and readable. */
const stableGrid = (grid: GridSnapshot): GridSnapshot =>
  Object.fromEntries(
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

describe.each([...STANDARD_VARIANTS])('%s variant output', (variant) => {
  it(
    'stays stable across the grid',
    async () => {
      const grid = await buildGrid([variant]);

      expect(stableGrid(grid)).toMatchSnapshot();
    },
    BUILD_TIMEOUT,
  );
});
