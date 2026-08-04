import { describe, expect, it } from 'vitest';
import { getNextTabIndex, resolveTabSelection } from './tabs.behavior';

describe('resolveTabSelection', () => {
  it('selects the tab matching the tracked index', () =>
    expect(resolveTabSelection({ selectedTab: 1, index: 1 })).toBe(true));
  it('rejects a tab whose index does not match', () =>
    expect(resolveTabSelection({ selectedTab: 1, index: 0 })).toBe(false));
  it('rejects an untracked tab (no index) even when selectedTab is set', () =>
    expect(resolveTabSelection({ selectedTab: 1, index: undefined })).toBe(
      false,
    ));
  it('rejects every tab when nothing is selected', () =>
    expect(resolveTabSelection({ selectedTab: null, index: 0 })).toBe(false));
});

describe('getNextTabIndex', () => {
  const noneDisabled = [false, false, false, false];

  it('moves right and wraps to the first tab', () => {
    expect(
      getNextTabIndex({ key: 'ArrowRight', currentIndex: 0, disabled: noneDisabled }),
    ).toBe(1);
    expect(
      getNextTabIndex({ key: 'ArrowRight', currentIndex: 3, disabled: noneDisabled }),
    ).toBe(0);
  });

  it('moves left and wraps to the last tab', () => {
    expect(
      getNextTabIndex({ key: 'ArrowLeft', currentIndex: 1, disabled: noneDisabled }),
    ).toBe(0);
    expect(
      getNextTabIndex({ key: 'ArrowLeft', currentIndex: 0, disabled: noneDisabled }),
    ).toBe(3);
  });

  it('jumps to the first and last tab on Home/End', () => {
    expect(
      getNextTabIndex({ key: 'Home', currentIndex: 2, disabled: noneDisabled }),
    ).toBe(0);
    expect(
      getNextTabIndex({ key: 'End', currentIndex: 0, disabled: noneDisabled }),
    ).toBe(3);
  });

  it('skips disabled tabs while moving right', () => {
    expect(
      getNextTabIndex({
        key: 'ArrowRight',
        currentIndex: 0,
        disabled: [false, true, true, false],
      }),
    ).toBe(3);
  });

  it('skips disabled tabs while moving left', () => {
    expect(
      getNextTabIndex({
        key: 'ArrowLeft',
        currentIndex: 3,
        disabled: [false, true, true, false],
      }),
    ).toBe(0);
  });

  it('lands on the first/last enabled tab for Home/End when an edge tab is disabled', () => {
    expect(
      getNextTabIndex({
        key: 'Home',
        currentIndex: 2,
        disabled: [true, false, false, false],
      }),
    ).toBe(1);
    expect(
      getNextTabIndex({
        key: 'End',
        currentIndex: 1,
        disabled: [false, false, false, true],
      }),
    ).toBe(2);
  });

  it('stays put when every tab is disabled', () => {
    expect(
      getNextTabIndex({
        key: 'ArrowRight',
        currentIndex: 1,
        disabled: [true, true, true],
      }),
    ).toBe(1);
  });
});
