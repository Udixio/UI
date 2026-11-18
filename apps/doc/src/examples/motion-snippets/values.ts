/**
 * The code of the "Follow pointer or state" tile on the root page: excerpts of the `motion-pointer` examples. Every line is
 * copied from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<div
  class="card"
  data-motion-value="tilt-x tilt-y"
>
// …
defineValue('tilt-x', {
  source: 'pointer',
  axis: 'x',
  range: [-8, 8],
});`;

export const react = `defineValue('tilt-x', {
  source: 'pointer',
  axis: 'x',
  range: [-8, 8],
});
// …
const tiltX = useMotionValue('tilt-x');
// …
<div
  ref={tiltX.ref}`;

export const angular = `defineValue('tilt-x', {
  source: 'pointer',
  axis: 'x',
  range: [-8, 8],
});
// …
<div
  udxMotionValue="tilt-x"`;

export const svelte = `defineValue('tilt-x', {
  source: 'pointer',
  axis: 'x',
  range: [-8, 8],
});
// …
<div
  {@attach motionValue('tilt-x')}`;
