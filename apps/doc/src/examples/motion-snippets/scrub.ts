/**
 * The code of the "Link to the scroll" tile on the root page: excerpts of the `motion-scrub` examples. Every line is copied
 * from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<article data-motion="parallax">
  <span>Moves against the scroll</span>
</article>
// …
connectMotion();`;

export const react = `function Card({ title }: CardProps) {
  const card = useMotion('parallax');
  return (
    <article
      ref={card.ref}
// …
      {title}
    </article>`;

export const angular = `<article
  udxMotion="parallax"
// …
  Moves against the scroll
</article>`;

export const svelte = `<article
  {@attach motion('parallax')}
// …
  Moves against the scroll
</article>`;
