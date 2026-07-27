import {
  getMenuItemRole,
  getMenuItemSelectionTransition,
} from './menu-item.behavior.js';

describe('menu item behavior', () => {
  it('resolves action and selection roles', () => {
    expect(getMenuItemRole({ purpose: 'actions', selectionType: 'none' })).toBe(
      'menuitem',
    );
    expect(
      getMenuItemRole({ purpose: 'actions', selectionType: 'single' }),
    ).toBe('menuitemradio');
    expect(
      getMenuItemRole({ purpose: 'actions', selectionType: 'multiple' }),
    ).toBe('menuitemcheckbox');
    expect(
      getMenuItemRole({ purpose: 'selection', selectionType: 'single' }),
    ).toBe('option');
  });

  it('toggles multiple selection and keeps single selection selected', () => {
    expect(
      getMenuItemSelectionTransition({
        disabled: false,
        selectionType: 'multiple',
        selected: false,
      }),
    ).toEqual({ blocked: false, nextSelected: true });
    expect(
      getMenuItemSelectionTransition({
        disabled: false,
        selectionType: 'multiple',
        selected: true,
      }),
    ).toEqual({ blocked: false, nextSelected: false });
    expect(
      getMenuItemSelectionTransition({
        disabled: false,
        selectionType: 'single',
        selected: true,
      }),
    ).toEqual({ blocked: true });
  });

  it('blocks disabled and non-selectable items', () => {
    expect(
      getMenuItemSelectionTransition({
        disabled: true,
        selectionType: 'multiple',
        selected: false,
      }),
    ).toEqual({ blocked: true });
    expect(
      getMenuItemSelectionTransition({
        disabled: false,
        selectionType: 'none',
        selected: false,
      }),
    ).toEqual({ blocked: true });
  });
});
