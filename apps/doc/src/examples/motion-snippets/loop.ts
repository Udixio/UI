/**
 * The code of the "Loop, and pause it" tile on the root page: excerpts of the `motion-loop` examples. Every line is copied
 * from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<span
  id="spin"
  data-motion="rotate"
// …
const el = document.querySelector('#spin');
// …`;

export const react = `const [paused, setPaused] = useState(false);
const el = useMotion('rotate', { paused });
// …
        ref={el.ref}
// …`;

export const angular = `<span
  udxMotion="rotate"
  [udxMotionPaused]="paused()"
// …`;

export const svelte = `<span
  {@attach motion('rotate', () => ({
    paused,
  }))}
// …`;
