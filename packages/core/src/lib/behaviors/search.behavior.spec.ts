import {
  getSearchExpansionTransition,
  getSearchKeyboardTransition,
} from './search.behavior.js';

describe('search behavior', () => {
  it('accepts expanded-state changes once and blocks disabled or identical requests', () => {
    expect(
      getSearchExpansionTransition({
        disabled: false,
        isExpanded: false,
        nextExpanded: true,
      }),
    ).toEqual({ blocked: false, nextExpanded: true });
    expect(
      getSearchExpansionTransition({
        disabled: false,
        isExpanded: true,
        nextExpanded: true,
      }),
    ).toEqual({ blocked: true });
    expect(
      getSearchExpansionTransition({
        disabled: true,
        isExpanded: false,
        nextExpanded: true,
      }),
    ).toEqual({ blocked: true });
  });

  it('opens the results surface and chooses its first or last option from the input', () => {
    expect(
      getSearchKeyboardTransition({
        disabled: false,
        isExpanded: false,
        hasResults: true,
        key: 'ArrowDown',
      }),
    ).toEqual({ blocked: false, nextExpanded: true, focus: 'first' });
    expect(
      getSearchKeyboardTransition({
        disabled: false,
        isExpanded: false,
        hasResults: true,
        key: 'ArrowUp',
      }),
    ).toEqual({ blocked: false, nextExpanded: true, focus: 'last' });
  });

  it('closes an expanded search with Escape and leaves ordinary editing keys alone', () => {
    expect(
      getSearchKeyboardTransition({
        disabled: false,
        isExpanded: true,
        hasResults: true,
        key: 'Escape',
      }),
    ).toEqual({ blocked: false, nextExpanded: false });
    expect(
      getSearchKeyboardTransition({
        disabled: false,
        isExpanded: false,
        hasResults: true,
        key: 'a',
      }),
    ).toEqual({ blocked: false });
    expect(
      getSearchKeyboardTransition({
        disabled: true,
        isExpanded: true,
        hasResults: true,
        key: 'Escape',
      }),
    ).toEqual({ blocked: true });
  });
});
