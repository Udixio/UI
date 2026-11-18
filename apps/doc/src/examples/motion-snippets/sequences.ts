/**
 * The code of the "Choreograph steps" tile on the root page: excerpts of the `motion-sequence` examples. Every line is
 * copied from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<div
  data-motion="intro-steps"
>
  <h3 data-motion-step="title">
    Steps, in order
  </h3>
// …
defineSequence('intro-steps', {
  verb: 'appear',
  steps: {
// …
});`;

export const react = `defineSequence('intro-steps', {
  verb: 'appear',
  steps: {
    title: {
      keyframes: [
        { opacity: 0, y: 12 },
        // …
      ],
    },
    // …
  },
});`;

export const angular = `defineSequence('intro-steps', {
  verb: 'appear',
  steps: {
    title: {
      keyframes: [
        { opacity: 0, y: 12 },
        // …
      ],
    },
    // …
  },
});`;

export const svelte = `defineSequence('intro-steps', {
  verb: 'appear',
  steps: {
    title: {
      keyframes: [
        { opacity: 0, y: 12 },
        // …
      ],
    },
    // …
  },
});`;
