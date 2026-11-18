/**
 * The code of the "Count a number" tile on the root page: excerpts of the `motion-values` examples. Every line is copied
 * from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<data
  value="12480"
  data-motion-value="visitors-count"
>12480</data>
// …
defineValue('visitors-count', {
  source: 'state',
  format: 'integer',
  range: [0, 100000],
});`;

export const react = `defineValue('visitors-count', {
  source: 'state',
  format: 'integer',
  range: [0, 100000],
});
// …
<data
  ref={counter.ref}
  value={visitors}`;

export const angular = `defineValue('visitors-count', {
  source: 'state',
  format: 'integer',
  range: [0, 100000],
});
// …
<data
  udxMotionValue="visitors-count"
  [attr.value]="visitors()"`;

export const svelte = `defineValue('visitors-count', {
  source: 'state',
  format: 'integer',
  range: [0, 100000],
});
// …
<data
  {@attach motionValue('visitors-count')}
  value={visitors}`;
