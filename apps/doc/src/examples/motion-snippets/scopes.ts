/**
 * The code of the "Per breakpoint" tile on the root page: excerpts of the `motion-scopes` examples. Every line is copied
 * from an example, never edited; a `// …` or `<!-- … -->` line marks what is left out.
 */

export const html = `<article
  data-motion="rise"
  class="md:[--udx-motion:fade-on-view]"
>Fades from md</article>
defineMotion('fade-on-view', {
  verb: 'reveal',
// …
});`;

export const react = `const fade = useMotion('rise');
<article
  ref={fade.ref}
  className="md:[--udx-motion:fade-on-view]"
>
  Fades from md
</article>`;

export const angular = `<article
  udxMotion="rise"
  class="md:[--udx-motion:fade-on-view]"
>Fades from md</article>`;

export const svelte = `<article
  {@attach motion('rise')}
  class="md:[--udx-motion:fade-on-view]"
>Fades from md</article>`;
