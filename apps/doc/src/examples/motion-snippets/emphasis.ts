/**
 * The code of the "Draw attention" tile on the root page: excerpts of the `motion-emphasis` examples. Every line is
 * copied from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<input
  data-motion="shake"
/>
<button
  data-motion="press"
>
<!-- … -->
  check.dataset.state = String(++presses);
// …
    code.dataset.state = String(refusals);`;

export const react = `const [checks, setChecks] = useState(0);
const [refusals, setRefusals] = useState(0);
// The shake replays when \`state\` changes.
const field = useMotion('shake', {
  state: refusals,
});
// The press replays on each click.
const check = useMotion('press', {
  state: checks,
});`;

export const angular = `<input
  udxMotion="shake"
  [udxMotionState]="refusals()"
// …
<button
  udxMotion="press"
  [udxMotionState]="checks()"
// …
protected readonly refusals = signal(0);`;

export const svelte = `<input
  {@attach motion('shake', () => ({
    state: refusals,
  }))}
<button
  type="button"
  {@attach motion('press', () => ({
    state: checks,
  }))}`;
