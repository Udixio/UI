/**
 * The code of the "Reduced motion" tile on the root page: excerpts of the `motion-policy` examples. Every line is copied
 * from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<div
  id="card"
  data-motion="slide"
  data-motion-restore-focus="#hide"
>Saved</div>
// …
const root = document.documentElement;
root.dataset.motionPolicy = 'reduce';`;

export const react = `const card = useMotion('slide', {
  present: open,
  restoreFocus: () => toggle.current,
});
{card.mounted && (
  <div ref={card.ref}>Saved</div>`;

export const angular = `@if (open()) {
  <div
    udxMotion="slide"
    [udxMotionRestoreFocus]="toggle"
  >Saved</div>
}`;

export const svelte = `{#if open}
  <div
    {@attach motion('slide', restore)}
    transition:presence
  >Saved</div>
{/if}`;
