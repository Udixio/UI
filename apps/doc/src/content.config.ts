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

// 4. Exporter un seul objet « collections » pour enregistrer votre/vos collection(s)
export const collections = { overviews };
