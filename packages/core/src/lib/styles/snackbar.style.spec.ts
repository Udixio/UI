import { describe, expect, it } from 'vitest';
import { snackbarStyle } from './snackbar.style';

type SnackbarStyleState = Parameters<typeof snackbarStyle>[0];

/** The class names of one element of a snackbar in its default state, as a list. */
const classesOf = (element: keyof ReturnType<typeof snackbarStyle>, state: Partial<SnackbarStyleState> = {}) =>
  snackbarStyle({ message: 'Saved', isOpen: true, className: undefined, ...state } as SnackbarStyleState)[element].split(/\s+/);

describe('snackbarStyle', () => {
  it('takes the close icon from the scheme it sits in, never from a forced dark scheme', () => {
    // Regression: a `dark` class on the icon made `text-inverse-on-surface` resolve from the dark palette, while the
    // container used the inverse surface of the current scheme. The icon was then nearly invisible in the light theme.
    expect(classesOf('icon')).not.toContain('dark');
  });

  it('uses the M3 inverse tokens: inverse surface for the container, inverse on-surface for the text and the icon', () => {
    expect(classesOf('snackbar')).toContain('bg-inverse-surface');
    expect(classesOf('supportingText')).toContain('text-inverse-on-surface');
    expect(classesOf('icon')).toContain('text-inverse-on-surface');
  });
});
