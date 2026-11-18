/**
 * The code of the "Springs and tokens" tile on the root page: excerpts of the `motion-tokens` examples. Every line is
 * copied from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<div data-motion="panel-in">Moves</div>
defineMotion('panel-in', {
  verb: 'appear',
// …
  timing: 'spring.fast.spatial',
});`;

export const react = `defineMotion('panel-in', {
  verb: 'appear',
// …
  timing: 'spring.fast.spatial',
});
const panel = useMotion('panel-in', {
  present: open,
});
if (!panel.mounted) return null;
return <div ref={panel.ref}>Moves</div>;`;

export const angular = `defineMotion('panel-in', {
  verb: 'appear',
// …
  timing: 'spring.fast.spatial',
});
<div udxMotion="panel-in">Moves</div>`;

export const svelte = `defineMotion('panel-in', {
  verb: 'appear',
// …
  timing: 'spring.fast.spatial',
});
<div {@attach motion('panel-in')}>
  Moves
</div>`;
