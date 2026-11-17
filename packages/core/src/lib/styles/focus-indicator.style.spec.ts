import { describe, expect, it } from 'vitest';
import { buttonStyle } from './button.style';
import { cardStyle } from './card.style';
import { fabStyle } from './fab.style';
import { iconButtonStyle } from './icon-button.style';
import { switchStyle } from './switch.style';

/**
 * The focus-visible outline of an interactive component is `focus-visible:outline-2`, whose style is the variable that
 * `outline-none` sets to `none` on the same element (Tailwind v4): with both classes the outline is never drawn, so a
 * keyboard user sees no focus. The root class of each component must draw its outline without `outline-none`.
 */
const roots: Record<string, string> = {
  button: buttonStyle({ variant: 'filled', size: 'medium', shape: 'rounded' } as Parameters<typeof buttonStyle>[0]).button,
  card: cardStyle({ variant: 'elevated', interactive: true } as Parameters<typeof cardStyle>[0]).card,
  iconButton: iconButtonStyle({} as Parameters<typeof iconButtonStyle>[0]).iconButton,
  switch: switchStyle({} as Parameters<typeof switchStyle>[0]).switch,
  fab: fabStyle({} as Parameters<typeof fabStyle>[0]).fab,
};

describe('focus indicator of the interactive components', () => {
  it.each(Object.entries(roots))('%s draws its focus-visible outline, with no outline-none on the same element', (_name, className) => {
    const tokens = className.split(/\s+/);
    expect(tokens).toContain('focus-visible:outline-2');
    expect(tokens).not.toContain('outline-none');
  });
});
