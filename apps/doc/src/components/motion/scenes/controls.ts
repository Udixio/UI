/**
 * The controls of the scenes, in the root page's tiles and on the need pages alike: a filled and a tonal button, a
 * segmented group and its button. Each one is a theme-token class string, so the scenes never hard-code a colour.
 */
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface';

export const filledControl = `h-10 rounded-full bg-primary px-5 text-label-large text-on-primary transition-shadow hover:shadow-md ${focusRing}`;
export const tonalControl = `h-10 rounded-full bg-secondary-container px-5 text-label-large text-on-secondary-container transition-shadow hover:shadow-md ${focusRing}`;
export const segmentedControl = 'inline-flex max-w-full flex-wrap overflow-hidden rounded-full border border-outline';
export const segmentControl =
  'h-10 px-3 text-label-large text-on-surface transition-colors hover:bg-surface-container-highest aria-pressed:bg-secondary-container aria-pressed:text-on-secondary-container focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-on-surface [&+&]:border-l [&+&]:border-outline';
