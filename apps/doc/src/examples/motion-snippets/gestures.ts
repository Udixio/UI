/**
 * The code of the "Drag, swipe, reorder" tile on the root page: excerpts of the `motion-gesture` examples. Every line is
 * copied from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<ul id="tasks">
  <li data-motion="reflow"
      data-motion-gesture="reorder">
// …
<div id="invoice"
     data-motion-gesture="complete">
defineGesture('reorder', {
  kind: 'reorder',
  alternative: 'grab',
});`;

export const react = `defineGesture('reorder', {
  kind: 'reorder',
  alternative: 'grab',
});
// …
  const row = useMotionGesture('reorder', {
    onReorder: (event) => {
      event.preventDefault();
// …
  const flow = useMotion('reflow');`;

export const angular = `<li
  udxMotion="reflow"
  udxMotionGesture="reorder"
  (udxReorder)="reorder($event)"
// …
    event.preventDefault();
// …
<div
  udxMotionGesture="complete"
  (udxSwipe)="swipe()"`;

export const svelte = `<li
  {@attach motion('reflow')}
  {@attach motionGesture('reorder', () => ({
    onReorder,
  }))}
// …
    event.preventDefault();`;
