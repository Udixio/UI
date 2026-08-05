import {
  getSwitchChangeTransition,
  getSwitchHandleOffset,
} from './switch.behavior';

describe('switch behavior', () => {
  it('toggles an enabled switch', () => {
    expect(
      getSwitchChangeTransition({ disabled: false, isChecked: false }),
    ).toEqual({ blocked: false, nextChecked: true });
  });

  it('blocks a disabled switch', () => {
    expect(
      getSwitchChangeTransition({ disabled: true, isChecked: true }),
    ).toEqual({ blocked: true });
  });

  it('resolves the unchecked handle translate offset', () => {
    expect(getSwitchHandleOffset(false)).toBe(0);
  });

  it('resolves the checked handle translate offset', () => {
    expect(getSwitchHandleOffset(true)).toBe(20);
  });

  it('keeps the resting handle center an equal distance from the track center whether checked or not', () => {
    const border = 2;
    const trackCenter = 26;
    const containerSize = 28;

    const unchecked = getSwitchHandleOffset(false);
    const checked = getSwitchHandleOffset(true);

    const uncheckedCenter = border + unchecked + containerSize / 2;
    const checkedCenter = border + checked + containerSize / 2;

    expect(trackCenter - uncheckedCenter).toBe(checkedCenter - trackCenter);
  });
});
