/**
 * The code of the "Draw or morph SVG" tile on the root page: excerpts of the `motion-svg` examples. Every line is copied
 * from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<path
  data-motion="check-draw"
// …
/>
// …
defineMotion('check-draw', {
  verb: 'reveal',
  keyframes: [{ draw: 0 }, { draw: 1 }],
  // …
});`;

export const react = `defineMotion('check-draw', {
  verb: 'reveal',
  keyframes: [{ draw: 0 }, { draw: 1 }],
  // …
});
<path
  ref={check.ref}`;

export const angular = `defineMotion('check-draw', {
  verb: 'reveal',
  keyframes: [{ draw: 0 }, { draw: 1 }],
  // …
});
<path
  udxMotion="check-draw"`;

export const svelte = `defineMotion('check-draw', {
  verb: 'reveal',
  keyframes: [{ draw: 0 }, { draw: 1 }],
  // …
});
<path
  bind:this={check}
  {@attach motion('check-draw')}`;
