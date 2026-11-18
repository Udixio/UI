/**
 * The code of the "Show and hide" tile on the root page: excerpts of the `motion-presence` examples. Every line is
 * copied from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<div id="saved" data-motion="slide">
  Saved to your library
</div>
<!-- … -->
<script type="module">
  // …
  // Hidden: the exit plays, then it goes.
  // Shown: the entry plays.
  card.hidden = !card.hidden;`;

export const react = `const [open, setOpen] = useState(true);
// Rendered while \`card.mounted\` is true,
// which lasts until its exit has played.
const card = useMotion('slide', {
  present: open,
});
// …
{card.mounted && (
  <div
    ref={card.ref}`;

export const angular = `  imports: [Motion],
  template: \`
    <!-- … -->
    @if (open()) {
      <div
        udxMotion="slide"`;

export const svelte = `<script lang="ts">
  // …
  let open = $state(true);
</script>
<!-- … -->
{#if open}
  <div
    {@attach motion('slide')}
    transition:presence`;
