import {
  getSplitButtonOpenTransition,
  isSplitButtonValid,
} from './split-button.behavior';

describe('getSplitButtonOpenTransition', () => {
  it('toggles from the menu trigger', () => {
    expect(
      getSplitButtonOpenTransition({
        isOpen: false,
        disabled: false,
        reason: 'trigger',
      }),
    ).toEqual({ blocked: false, nextOpen: true });
    expect(
      getSplitButtonOpenTransition({
        isOpen: true,
        disabled: false,
        reason: 'trigger',
      }),
    ).toEqual({ blocked: false, nextOpen: false });
  });

  it('opens from the optional arrow-key shortcut', () => {
    expect(
      getSplitButtonOpenTransition({
        isOpen: false,
        disabled: false,
        reason: 'keyboard',
      }),
    ).toEqual({ blocked: false, nextOpen: true });
  });

  it('blocks open requests when disabled and still allows dismissal', () => {
    expect(
      getSplitButtonOpenTransition({
        isOpen: false,
        disabled: true,
        reason: 'trigger',
      }),
    ).toEqual({ blocked: true });
    expect(
      getSplitButtonOpenTransition({
        isOpen: true,
        disabled: true,
        reason: 'dismiss',
      }),
    ).toEqual({ blocked: false, nextOpen: false });
  });
});

describe('isSplitButtonValid', () => {
  const base = {
    menuLabel: 'More actions',
    actions: [{ id: 'copy', label: 'Copy' }],
  };

  it('accepts labelled actions and accessible icon-only actions', () => {
    expect(isSplitButtonValid({ ...base, label: 'Save' })).toBe(true);
    expect(
      isSplitButtonValid({
        ...base,
        icon: 'save',
        accessibleLabel: 'Save',
      }),
    ).toBe(true);
  });

  it('requires menu and primary accessible names plus a menu action', () => {
    expect(isSplitButtonValid({ ...base, label: ' ' })).toBe(false);
    expect(
      isSplitButtonValid({ ...base, icon: 'save', accessibleLabel: ' ' }),
    ).toBe(false);
    expect(isSplitButtonValid({ ...base, label: 'Save', menuLabel: ' ' })).toBe(
      false,
    );
    expect(isSplitButtonValid({ ...base, label: 'Save', actions: [] })).toBe(
      false,
    );
    expect(
      isSplitButtonValid({
        ...base,
        label: 'Save',
        actions: [
          { id: 'duplicate', label: 'Copy' },
          { id: 'duplicate', label: 'Share' },
        ],
      }),
    ).toBe(false);
    expect(
      isSplitButtonValid({
        ...base,
        label: 'Save',
        actions: [{ id: ' ', label: 'Copy' }],
      }),
    ).toBe(false);
    expect(
      isSplitButtonValid({
        ...base,
        label: 'Save',
        actions: [{ id: 'copy', label: ' ' }],
      }),
    ).toBe(false);
  });
});
