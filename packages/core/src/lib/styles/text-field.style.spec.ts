import { describe, expect, it } from 'vitest';
import { textFieldStyle } from './text-field.style';

const outlinedFloatingState = {
  variant: 'outlined',
  isFloating: true,
  isFocused: true,
} as const;

describe('textFieldStyle', () => {
  it('aligns an outlined floating label with its legend notch', () => {
    expect(textFieldStyle(outlinedFloatingState as any).label).toContain(
      'left-2',
    );
  });

  it('cancels the leading icon footprint when aligning an outlined floating label', () => {
    const styles = textFieldStyle({
      ...outlinedFloatingState,
      leadingIcon: '<svg></svg>',
    } as any);

    expect(styles.label).toContain('-left-6');
    expect(styles.label).not.toContain('left-2');
  });
});
