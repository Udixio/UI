/**
 * The code of the "Animate any CSS" tile on the root page: excerpts of the `motion-animate` examples. Every line is copied
 * from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `animateStyle(card, STATES[state], {
  timing: 'spring.default.effects',
});
// …
const offset = createSpring(0, {
  timing: 'spring.default.spatial',
// …`;

export const react = `const to = (state + 1) % STATES.length;
animateStyle(card.current!, STATES[to]!, {
  timing: 'spring.default.effects',
});
// …
offset.current = createSpring(0, {
  timing: 'spring.default.spatial',
// …`;

export const angular = `const card = this.card().nativeElement;
animateStyle(card, STATES[this.state]!, {
  timing: 'spring.default.effects',
});
// …
this.offset = createSpring(0, {
  timing: 'spring.default.spatial',
// …`;

export const svelte = `animateStyle(card, STATES[state]!, {
  timing: 'spring.default.effects',
});
// …
const offset = createSpring(0, {
  timing: 'spring.default.spatial',
// …`;
