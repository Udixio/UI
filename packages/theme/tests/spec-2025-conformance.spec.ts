/**
 * Conformance: the four standard variants must reproduce upstream
 * material-color-utilities, spec 2025, exactly.
 *
 * This is the contract of the package, not a regression guard. A failure here
 * means the output is no longer Material Design 3 — which is a bug, unless the
 * fixture is being deliberately moved to a newer upstream.
 *
 * The class of defect this catches is the one that survives review: code that
 * reads like spec 2025 while computing something else.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  buildGrid,
  STANDARD_VARIANTS,
  type GridSnapshot,
} from './helpers/grid.js';

type FixtureCase = {
  palettes: Record<string, [number, number]>;
  colors: Record<string, string>;
};

type Fixture = {
  _meta: { commit: string; specVersion: string; cases: number };
  cases: Record<string, FixtureCase>;
};

// Read rather than import: keeps a 1.2 MB fixture out of the module graph and
// sidesteps JSON import attributes under nodenext resolution.
const fixture: Fixture = JSON.parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      'fixtures',
      'material-spec-2025.json',
    ),
    'utf8',
  ),
);

const reference = fixture.cases;
const BUILD_TIMEOUT = 180_000;

let actual: GridSnapshot;

beforeAll(async () => {
  actual = await buildGrid(STANDARD_VARIANTS);
}, BUILD_TIMEOUT);

describe('spec 2025 conformance', () => {
  it('reproduces upstream colours exactly for the standard variants', () => {
    const mismatches: string[] = [];
    let compared = 0;

    for (const [key, expectedCase] of Object.entries(reference)) {
      const actualCase = actual[key];
      if (!actualCase) {
        mismatches.push(`${key}: case missing from output`);
        continue;
      }

      for (const [role, expectedHex] of Object.entries(expectedCase.colors)) {
        const actualHex = actualCase.colors[role];
        if (actualHex === undefined) {
          mismatches.push(`${key} ${role}: role missing from output`);
          continue;
        }
        compared++;
        if (actualHex !== expectedHex) {
          mismatches.push(
            `${key} ${role}: expected ${expectedHex}, got ${actualHex}`,
          );
        }
      }
    }

    // Guard against the suite silently comparing nothing.
    expect(compared).toBe(fixture._meta.cases * 51);

    expect(
      mismatches.slice(0, 40).join('\n') +
        (mismatches.length > 40 ? `\n… and ${mismatches.length - 40} more` : ''),
    ).toBe('');
  });

  it('derives the palettes upstream derives', () => {
    const mismatches: string[] = [];

    for (const [key, expectedCase] of Object.entries(reference)) {
      for (const [name, [hue, chroma]] of Object.entries(
        expectedCase.palettes,
      )) {
        // neutralVariant is a spec 2021 construct this package dropped. It is
        // still in the fixture because upstream's 2025 delegate extends the
        // 2021 one and never overrides its generator.
        if (name === 'neutralVariant') continue;

        const got = actual[key]?.palettes[name];
        if (!got) {
          mismatches.push(`${key} ${name}: palette missing`);
          continue;
        }
        if (Math.abs(got[0] - hue) > 1e-9 || Math.abs(got[1] - chroma) > 1e-9) {
          mismatches.push(
            `${key} ${name}: expected (${hue}, ${chroma}), got (${got[0]}, ${got[1]})`,
          );
        }
      }
    }

    expect(mismatches.slice(0, 20).join('\n')).toBe('');
  });
});
