/**
 * The code of the "Morph one into another" tile on the root page: excerpts of the `motion-shared` examples. Every line is
 * copied from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<button
  data-motion="reflow"
  data-motion-shared="photo-1"
>
// …
<div
  id="detail"
  data-motion-shared=""
// …
detail.dataset.motionShared = key;
thumb.hidden = true;
detail.hidden = false;`;

export const react = `const [open, setOpen] = useState(0);
// …
  const thumb = useMotion('reflow', {
    shared: \`photo-\${id}\`,
  });
// …
  const detail = useMotion('reflow', {
    shared: \`photo-\${id}\`,
  });`;

export const angular = `@for (id of photos; track id) {
  @if (open() !== id) {
    <button
      udxMotion="reflow"
      [udxMotionShared]="'photo-' + id"
// …
@if (open(); as id) {
  <div
    udxMotion="reflow"
    [udxMotionShared]="'photo-' + id"`;

export const svelte = `{#each photos as id (id)}
  {#if open !== id}
    <button
      type="button"
      {@attach motion('reflow', () => ({
        shared: \`photo-\${id}\`,
      }))}
// …
{#if open !== null}`;
