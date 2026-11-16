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

  it('transitions the translate of the floating label, which centres it at rest', () => {
    // The resting label is centred with `-translate-y-1/2`, the individual `translate` property: a transition that
    // leaves it out makes the label snap to its floating place while the other properties ease.
    const { label } = textFieldStyle({ variant: 'filled', isFloating: false, isFocused: false } as any);

    expect(label).toContain('-translate-y-1/2');
    expect(label).toMatch(/transition-\[[^\]]*\btranslate\b/);
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
