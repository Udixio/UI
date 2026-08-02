import { describe, expect, it } from 'vitest';
import {
  getNextNavigationRailExtended,
  resolveNavigationRailItemSelection,
} from './navigation-rail.behavior';

describe('getNextNavigationRailExtended', () => {
  it('collapses an extended rail', () =>
    expect(getNextNavigationRailExtended(true)).toBe(false));
  it('extends a collapsed rail', () =>
    expect(getNextNavigationRailExtended(false)).toBe(true));
});

describe('resolveNavigationRailItemSelection', () => {
  it('follows the parent-tracked index when present', () =>
    expect(
      resolveNavigationRailItemSelection({
        selectedItem: 1,
        index: 1,
        selected: false,
      }),
    ).toBe(true));
  it('rejects an item whose index does not match', () =>
    expect(
      resolveNavigationRailItemSelection({
        selectedItem: 1,
        index: 0,
        selected: true,
      }),
    ).toBe(false));
  it('rejects an untracked item even when selectedItem is set', () =>
    expect(
      resolveNavigationRailItemSelection({
        selectedItem: 1,
        index: undefined,
        selected: true,
      }),
    ).toBe(false));
  it('falls back to the uncontrolled selected flag without a tracked index', () =>
    expect(
      resolveNavigationRailItemSelection({
        selectedItem: null,
        index: undefined,
        selected: true,
      }),
    ).toBe(true));
  it('falls back to false without a tracked index or selected flag', () =>
    expect(
      resolveNavigationRailItemSelection({
        selectedItem: undefined,
        index: 2,
        selected: false,
      }),
    ).toBe(false));
});
