/**
 * The code of the "Make a list appear" tile on the root page: excerpts of the `motion-list` examples. Every line is
 * copied from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<li data-motion="inbox reflow"
    data-motion-gesture="dismiss"></li>
<!-- … -->
<script type="module">
  // …
  defineMotion('inbox', {
    // …
    stagger: 'normal',
    origin: 'first',
    exit: 'out-of-flow',
  });`;

export const react = `defineMotion('inbox', {
  // …
  stagger: 'normal',
  origin: 'first',
  exit: 'out-of-flow',
});
// …
const row = useMotion('inbox reflow', {
  present: item.present,
});
// …
<li ref={row.ref}>`;

export const angular = `defineMotion('inbox', {
  // …
  stagger: 'normal',
  origin: 'first',
  exit: 'out-of-flow',
});
// …
imports: [Motion],
template: \`
  <!-- … -->
  @for (item of list(); track item.id) {
    <li udxMotion="inbox reflow">`;

export const svelte = `<script module lang="ts">
  // …
  defineMotion('inbox', {
    // …
    stagger: 'normal',
    origin: 'first',
    exit: 'out-of-flow',
  });
</script>
<!-- … -->
<li {@attach motion('inbox reflow')}
  transition:presence>`;
