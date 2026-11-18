/**
 * The code of the "Move to a new place" tile on the root page: excerpts of the `motion-layout` examples. Every line is
 * copied from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<div data-motion-scope>
// …
  id="card"
  data-motion="reflow"
// …
card.style.width = wide ? '100%' : '60%';
// An inline style is not observed,
// so the move is played by hand.
getMotion(card, 'layout')?.play();`;

export const react = `const [wide, setWide] = useState(false);
const card = useMotion('reflow');
// …
<div
  ref={card.ref}
  data-wide={wide || undefined}`;

export const angular = `template: \`
  <div
    udxMotion="reflow"
    [attr.data-wide]="wide() || null"
// …
protected readonly wide = signal(false);`;

export const svelte = `<script lang="ts">
  let wide = $state(false);
</script>
<div
  {@attach motion('reflow')}
  data-wide={wide || undefined}`;
