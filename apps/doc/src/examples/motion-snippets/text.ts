/**
 * The code of the "Animate text" tile on the root page: excerpts of the `motion-text` examples. Every line is copied from
 * an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<p
  data-motion="headline"
  class="text-headline-medium"
// …
defineMotion('headline', {
  verb: 'reveal',
  split: 'words',
  reduced: 'fade',
  keyframes: [
    { opacity: 0, y: 12 },`;

export const react = `defineMotion('headline', {
  verb: 'reveal',
  split: 'words',
  reduced: 'fade',
  // …
});
const headline = useMotion('headline');
<p
  ref={headline.ref}`;

export const angular = `defineMotion('headline', {
  verb: 'reveal',
  split: 'words',
  reduced: 'fade',
  // …
});
<p
  udxMotion="headline"`;

export const svelte = `defineMotion('headline', {
  verb: 'reveal',
  split: 'words',
  reduced: 'fade',
  // …
});
<p
  bind:this={headline}
  {@attach motion('headline')}`;
