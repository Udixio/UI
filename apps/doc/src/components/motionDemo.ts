/** Classes of the controls and surfaces of the motion pages, the same as the demo page's. */
export const buttonClass =
  'rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface';
export const cardClass = 'rounded-2xl bg-surface-container-high p-6 text-body-large text-on-surface';
export const demoClass = 'not-prose flex flex-col items-start gap-4';

/** A segmented control: a row of toggle buttons that share one outline, one of them pressed. */
export const segmentedClass = 'inline-flex max-w-full flex-wrap overflow-hidden rounded-full border border-outline';
/** One button of a segmented control; the pressed one (`aria-pressed="true"`) takes the secondary container. */
export const segmentedButtonClass =
  'h-10 px-4 text-label-large text-on-surface transition-colors hover:bg-surface-container-highest aria-pressed:bg-secondary-container aria-pressed:text-on-secondary-container focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-on-surface [&+&]:border-l [&+&]:border-outline';
/** A small mono chip: an API name, a live value in a stage's control row, a count. */
export const chipClass = 'inline-flex items-center rounded-lg bg-surface-container-high px-2.5 py-1 font-mono text-label-medium text-on-surface-variant';
/** The row of controls above a scene: its buttons, groups and chips, wrapping on a phone. */
export const stageControlsClass = 'flex flex-wrap items-center gap-2';
