// 1. Importer des utilitaires depuis `astro:content`
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// 2. Importer un ou plusieurs chargeurs

// 3. Définir votre/vos collection(s)
const overviews = defineCollection({
  loader: glob({
    pattern: '**/*.overview.{md,mdx}',
    base: './src/data/components',
  }),
  /* ... */
});
const api = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: './src/data/api',
  }),
  /* ... */
});

export const collections = { overviews, api };
