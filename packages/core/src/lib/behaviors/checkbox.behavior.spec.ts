import { getCheckboxChangeTransition } from './checkbox.behavior';

describe('checkbox behavior', () => {
  it('toggles an enabled checkbox', () => {
    expect(
      getCheckboxChangeTransition({ disabled: false, isChecked: false }),
    ).toEqual({ blocked: false, nextChecked: true });
  });

  it('blocks a disabled checkbox', () => {
    expect(
      getCheckboxChangeTransition({ disabled: true, isChecked: true }),
    ).toEqual({ blocked: true });
  });
});
