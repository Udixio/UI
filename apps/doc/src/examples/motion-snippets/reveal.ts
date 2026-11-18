/**
 * The code of the "Reveal on scroll" tile on the root page: excerpts of the `motion-reveal` examples. Every line is copied
 * from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<ol
// …
  aria-label="Feed"
>
  <li data-motion="rise">
    <span>Release notes</span>
  </li>
// …
</ol>`;

export const react = `function Card({ title }: CardProps) {
  const card = useMotion('rise');
  return (
    <li
      ref={card.ref}
// …
      {title}
    </li>`;

export const angular = `@for (title of titles; track title) {
  <li
    udxMotion="rise"
// …
    {{ title }}
  </li>
}`;

export const svelte = `{#each TITLES as title (title)}
  <li
    {@attach motion('rise')}
// …
    {title}
  </li>
{/each}`;
