import { describe, expect, it } from 'vitest';
import { navigationRailStyle } from './navigation-rail.style';

type RailStyleState = Parameters<typeof navigationRailStyle>[0];

const railClassesOf = (isExtended: boolean) =>
  navigationRailStyle({ isExtended, alignment: 'top', variant: 'standard', className: undefined } as RailStyleState).navigationRail.split(/\s+/);

describe('navigationRailStyle', () => {
  it('gives the rail the same classes collapsed and extended, so its width is moved only by the width controller', () => {
    // Regression: a width class that depends on the extended state (`max-w-24`, `min-w-[220px]`) changes the rail's
    // width in the same frame as the state, before any motion can interpolate it.
    expect(railClassesOf(true)).toEqual(railClassesOf(false));
    expect(railClassesOf(false)).not.toContain('min-w-[220px]');
    expect(railClassesOf(false)).not.toContain('max-w-24');
  });
});
