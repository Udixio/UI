import {
  formatTextFieldIsoDate,
  parseTextFieldIsoDate,
  resolveTextFieldFloating,
  resolveTextFieldTrailingIcon,
  sanitizeTextFieldDateInput,
} from './text-field.behavior.js';

describe('text field behavior', () => {
  it('floats for focus, value, date mode, or an open select menu', () => {
    expect(
      resolveTextFieldFloating({
        isFocused: false,
        hasValue: false,
        type: 'text',
        isMenuOpen: false,
      }),
    ).toBe(false);
    expect(
      resolveTextFieldFloating({
        isFocused: true,
        hasValue: false,
        type: 'text',
        isMenuOpen: false,
      }),
    ).toBe(true);
    expect(
      resolveTextFieldFloating({
        isFocused: false,
        hasValue: true,
        type: 'text',
        isMenuOpen: false,
      }),
    ).toBe(true);
    expect(
      resolveTextFieldFloating({
        isFocused: false,
        hasValue: false,
        type: 'date',
        isMenuOpen: false,
      }),
    ).toBe(true);
    expect(
      resolveTextFieldFloating({
        isFocused: false,
        hasValue: false,
        type: 'select',
        isMenuOpen: true,
      }),
    ).toBe(true);
    expect(
      resolveTextFieldFloating({
        isFocused: false,
        hasValue: false,
        type: 'select',
        isMenuOpen: false,
      }),
    ).toBe(false);
  });

  it('resolves the trailing icon in explicit > mode order', () => {
    expect(
      resolveTextFieldTrailingIcon({
        type: 'text',
        trailingIcon: 'custom',
        isMenuOpen: false,
        dateIcon: 'calendar',
        menuOpenIcon: 'up',
        menuClosedIcon: 'down',
      }),
    ).toBe('custom');
    expect(
      resolveTextFieldTrailingIcon({
        type: 'date',
        trailingIcon: undefined,
        isMenuOpen: false,
        dateIcon: 'calendar',
        menuOpenIcon: 'up',
        menuClosedIcon: 'down',
      }),
    ).toBe('calendar');
    expect(
      resolveTextFieldTrailingIcon({
        type: 'select',
        trailingIcon: undefined,
        isMenuOpen: true,
        dateIcon: 'calendar',
        menuOpenIcon: 'up',
        menuClosedIcon: 'down',
      }),
    ).toBe('up');
    expect(
      resolveTextFieldTrailingIcon({
        type: 'select',
        trailingIcon: undefined,
        isMenuOpen: false,
        dateIcon: 'calendar',
        menuOpenIcon: 'up',
        menuClosedIcon: 'down',
      }),
    ).toBe('down');
    expect(
      resolveTextFieldTrailingIcon({
        type: 'text',
        trailingIcon: undefined,
        isMenuOpen: false,
        dateIcon: 'calendar',
        menuOpenIcon: 'up',
        menuClosedIcon: 'down',
      }),
    ).toBeUndefined();
  });

  it('round-trips an ISO date value', () => {
    expect(parseTextFieldIsoDate('')).toBeNull();
    expect(parseTextFieldIsoDate('2026-08-04')).toEqual(new Date(2026, 7, 4));
    expect(formatTextFieldIsoDate(null)).toBe('');
    expect(formatTextFieldIsoDate(new Date(2026, 7, 4))).toBe('2026-08-04');
  });

  it('sanitizes typed/pasted date input down to digits and dashes, capped at YYYY-MM-DD length', () => {
    expect(sanitizeTextFieldDateInput('egrrg')).toBe('');
    expect(sanitizeTextFieldDateInput('2026-08-07')).toBe('2026-08-07');
    expect(sanitizeTextFieldDateInput('20a26-0b8-0c7')).toBe('2026-08-07');
    expect(sanitizeTextFieldDateInput('2026-08-071234')).toBe('2026-08-07');
    expect(sanitizeTextFieldDateInput('hello 2026-08-07 world')).toBe(
      '2026-08-07',
    );
    expect(sanitizeTextFieldDateInput('')).toBe('');
  });

  it('auto-inserts the dashes as digits accumulate, so typing "20260807" in sequence reads back as "2026-08-07"', () => {
    // Simulates typing digit by digit, each keystroke's result feeding the
    // next -- the exact interaction a masked date field must support.
    let typed = '';
    const keystrokes = '20260807';
    const afterEachKeystroke: string[] = [];
    for (const digit of keystrokes) {
      typed = sanitizeTextFieldDateInput(typed + digit);
      afterEachKeystroke.push(typed);
    }

    expect(afterEachKeystroke).toEqual([
      '2',
      '20',
      '202',
      '2026',
      '2026-0',
      '2026-08',
      '2026-08-0',
      '2026-08-07',
    ]);
  });

  it('retracts a trailing dash when backspacing crosses back below a 4- or 6-digit boundary', () => {
    // Simulates backspacing from the end -- removing the mask's own last
    // character never removes a bare dash, since the mask never ends on
    // one, so this self-corrects without any special-casing.
    let typed = '2026-08-07';
    const afterEachBackspace: string[] = [];
    for (let i = 0; i < 4; i++) {
      typed = sanitizeTextFieldDateInput(typed.slice(0, -1));
      afterEachBackspace.push(typed);
    }

    expect(afterEachBackspace).toEqual([
      '2026-08-0',
      '2026-08',
      '2026-0',
      '2026',
    ]);
  });
});
