import { describe, expect, it } from 'vitest';
import { buttonStyle } from './button.style';
import { cardStyle } from './card.style';
import { chipStyle } from './chip.style';
import { chipsStyle } from './chips.style';
import { datePickerStyle } from './date-picker.style';
import { fabStyle } from './fab.style';
import { iconButtonStyle } from './icon-button.style';
import { menuItemStyle } from './menu-item.style';
import { switchStyle } from './switch.style';
import { tabStyle } from './tab.style';

/**
 * The focus-visible outline of an interactive component is `focus-visible:outline-2`, whose style is the variable that
 * `outline-none` sets to `none` on the same element (Tailwind v4): with both classes the outline is never drawn, so a
 * keyboard user sees no focus. The class of each focus target (the root, or the element that takes the focus) must draw
 * its outline without `outline-none`. The browser spec (`focus-indicator.browser.spec.ts`) checks the drawn outline.
 */
const roots: Record<string, string> = {
  button: buttonStyle({ variant: 'filled', size: 'medium', shape: 'rounded' } as Parameters<typeof buttonStyle>[0]).button,
  card: cardStyle({ variant: 'elevated', interactive: true } as Parameters<typeof cardStyle>[0]).card,
  iconButton: iconButtonStyle({} as Parameters<typeof iconButtonStyle>[0]).iconButton,
  switch: switchStyle({} as Parameters<typeof switchStyle>[0]).switch,
  fab: fabStyle({} as Parameters<typeof fabStyle>[0]).fab,
  tab: tabStyle({ variant: 'primary', label: 'Tab' } as Parameters<typeof tabStyle>[0]).tab,
  chip: chipStyle({ variant: 'filled', isInteractive: true, isFocused: true } as Parameters<typeof chipStyle>[0]).chip,
  chipLabelWhileEditing: chipStyle({ variant: 'filled', isEditing: true } as Parameters<typeof chipStyle>[0]).label,
  chips: chipsStyle({ scrollable: false } as Parameters<typeof chipsStyle>[0]).chips,
  menuItem: menuItemStyle({ variant: 'standard' } as Parameters<typeof menuItemStyle>[0]).menuItem,
  datePickerDay: [
    buttonStyle({ variant: 'text', size: 'small', shape: 'rounded', shapeFeedback: 'none' } as Parameters<typeof buttonStyle>[0]).button,
    datePickerStyle({ mode: 'single' } as Parameters<typeof datePickerStyle>[0]).dayButton,
  ].join(' '),
};

describe('focus indicator of the interactive components', () => {
  it.each(Object.entries(roots))('%s draws its focus-visible outline, with no outline-none on the same element', (_name, className) => {
    const tokens = className.split(/\s+/);
    expect(tokens).toContain('focus-visible:outline-2');
    expect(tokens).not.toContain('outline-none');
  });
});
