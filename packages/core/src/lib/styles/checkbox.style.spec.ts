import { describe, expect, it } from 'vitest';
import { checkboxStyle } from './checkbox.style';

describe('checkbox style geometry', () => {
  it('keeps the visual box compact while the interaction surface remains 40px', () => {
    type CheckboxState = Parameters<typeof checkboxStyle>[0];
    const styles = checkboxStyle({
      checked: false,
      defaultChecked: false,
      indeterminate: false,
      disabled: false,
      invalid: false,
      id: 'updates',
      name: undefined,
      value: undefined,
      required: false,
      isChecked: false,
      isFocused: false,
      className: undefined,
    } as CheckboxState);

    expect(styles.checkbox).toContain('size-4');
    expect(styles.checkbox).not.toMatch(/inline-flex size-10/);
    expect(styles.checkbox).toContain('has-[:focus-visible]:after:size-10');
    expect(styles.input).toContain('size-10');
    expect(styles.input).toContain('left-1/2');
    expect(styles.input).toContain('top-1/2');
    expect(styles.input).toContain('-translate-x-1/2');
    expect(styles.input).toContain('-translate-y-1/2');
    expect(styles.box).toContain('size-4');
    expect(styles.stateLayer).toContain('size-10');
    expect(styles.stateLayer).toContain('left-1/2');
    expect(styles.stateLayer).toContain('top-1/2');
  });
});
