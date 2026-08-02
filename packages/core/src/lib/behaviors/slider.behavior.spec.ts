import {
  getSliderKeyboardTransition,
  getSliderPercentFromValue,
  getSliderValueFromPercent,
  resolveSliderBounds,
  snapSliderValue,
} from './slider.behavior';

describe('slider behavior', () => {
  describe('resolveSliderBounds', () => {
    it('resolves finite bounds unchanged', () => {
      expect(resolveSliderBounds(0, 100)).toEqual({ min: 0, max: 100 });
    });

    it('maps infinite ends to the nearest finite mark, skipping open sentinels', () => {
      const marks = [
        { value: -Infinity, label: 'Min' },
        { value: 0, label: '0' },
        { value: 100, label: '100' },
        { value: Infinity, label: 'Max' },
      ];
      expect(resolveSliderBounds(-Infinity, Infinity, marks)).toEqual({
        min: 0,
        max: 100,
      });
    });

    it('falls back to 0/100 when infinite without marks', () => {
      expect(resolveSliderBounds(-Infinity, Infinity)).toEqual({
        min: 0,
        max: 100,
      });
    });
  });

  describe('getSliderPercentFromValue', () => {
    it('maps a mid-range value to its percent', () => {
      expect(getSliderPercentFromValue(25, { min: 0, max: 100 })).toBe(25);
    });

    it('maps Infinity/-Infinity straight to 100/0', () => {
      expect(getSliderPercentFromValue(Infinity, { min: 0, max: 100 })).toBe(
        100,
      );
      expect(getSliderPercentFromValue(-Infinity, { min: 0, max: 100 })).toBe(
        0,
      );
    });
  });

  describe('snapSliderValue', () => {
    it('rounds to the nearest step', () => {
      expect(snapSliderValue(23, { min: 0, max: 100, step: 10 })).toBe(20);
      expect(snapSliderValue(27, { min: 0, max: 100, step: 10 })).toBe(30);
    });

    it('snaps to the nearest mark when there is no step', () => {
      const marks = [
        { value: 0, label: '0' },
        { value: 25, label: '25' },
        { value: 100, label: '100' },
      ];
      expect(snapSliderValue(60, { min: 0, max: 100, marks })).toBe(25);
      expect(snapSliderValue(80, { min: 0, max: 100, marks })).toBe(100);
    });

    it('clamps below min and above max at the exact boundary, at percent 0', () => {
      expect(snapSliderValue(0, { min: 0, max: 100, step: 10 })).toBe(0);
      expect(snapSliderValue(-5, { min: 0, max: 100, step: 10 })).toBe(0);
      expect(snapSliderValue(105, { min: 0, max: 100, step: 10 })).toBe(100);
    });

    it('resolves an open boundary back to Infinity/-Infinity', () => {
      const marks = [
        { value: -Infinity, label: 'Min' },
        { value: 0, label: '0' },
        { value: 100, label: '100' },
        { value: Infinity, label: 'Max' },
      ];
      expect(
        snapSliderValue(0, { min: -Infinity, max: Infinity, marks }),
      ).toBe(-Infinity);
      expect(
        snapSliderValue(100, { min: -Infinity, max: Infinity, marks }),
      ).toBe(Infinity);
    });
  });

  describe('getSliderValueFromPercent', () => {
    it('handles percent 0 without treating it as falsy', () => {
      expect(
        getSliderValueFromPercent(0, { min: 0, max: 100, step: 10 }),
      ).toBe(0);
    });

    it('clamps out-of-range percents', () => {
      expect(
        getSliderValueFromPercent(-20, { min: 0, max: 100, step: 10 }),
      ).toBe(0);
      expect(
        getSliderValueFromPercent(150, { min: 0, max: 100, step: 10 }),
      ).toBe(100);
    });

    it('snaps the interpolated value to step', () => {
      expect(
        getSliderValueFromPercent(23, { min: 0, max: 100, step: 10 }),
      ).toBe(20);
    });
  });

  describe('getSliderKeyboardTransition', () => {
    it('blocks every key when disabled', () => {
      expect(
        getSliderKeyboardTransition({
          key: 'ArrowRight',
          value: 50,
          min: 0,
          max: 100,
          step: 10,
          disabled: true,
        }),
      ).toEqual({ blocked: true });
    });

    it('moves by one step on ArrowRight/ArrowLeft', () => {
      expect(
        getSliderKeyboardTransition({
          key: 'ArrowRight',
          value: 50,
          min: 0,
          max: 100,
          step: 10,
        }),
      ).toEqual({ blocked: false, nextValue: 60 });
      expect(
        getSliderKeyboardTransition({
          key: 'ArrowLeft',
          value: 50,
          min: 0,
          max: 100,
          step: 10,
        }),
      ).toEqual({ blocked: false, nextValue: 40 });
    });

    it('jumps to min/max on Home/End', () => {
      expect(
        getSliderKeyboardTransition({
          key: 'Home',
          value: 50,
          min: 0,
          max: 100,
          step: 10,
        }),
      ).toEqual({ blocked: false, nextValue: 0 });
      expect(
        getSliderKeyboardTransition({
          key: 'End',
          value: 50,
          min: 0,
          max: 100,
          step: 10,
        }),
      ).toEqual({ blocked: false, nextValue: 100 });
    });

    it('moves between marks when there is no step', () => {
      const marks = [
        { value: 0, label: '0' },
        { value: 25, label: '25' },
        { value: 50, label: '50' },
      ];
      expect(
        getSliderKeyboardTransition({
          key: 'ArrowRight',
          value: 25,
          min: 0,
          max: 50,
          marks,
        }),
      ).toEqual({ blocked: false, nextValue: 50 });
      expect(
        getSliderKeyboardTransition({
          key: 'ArrowLeft',
          value: 0,
          min: 0,
          max: 50,
          marks,
        }),
      ).toEqual({ blocked: true });
    });

    it('blocks an unhandled key', () => {
      expect(
        getSliderKeyboardTransition({
          key: 'Tab',
          value: 50,
          min: 0,
          max: 100,
          step: 10,
        }),
      ).toEqual({ blocked: true });
    });
  });
});
