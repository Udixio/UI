// 1. Importer des utilitaires depuis `astro:content`
import { defineCollection, z } from 'astro:content';
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
const apiTags = z
  .object({
    status: z.string().optional(),
    category: z.string().optional(),
    parent: z.string().optional(),
    devx: z.string().optional(),
    a11y: z.string().optional(),
    limitations: z.string().optional(),
  })
  .strict();

const apiMember = z
  .object({
    name: z.string(),
    description: z.string(),
    required: z.boolean(),
    type: z.object({ name: z.string() }).strict(),
    defaultValue: z.object({ value: z.string() }).strict().nullable(),
    alias: z.string().optional(),
  })
  .strict();

const frameworkBase = {
  filePath: z.string(),
  description: z.string(),
  tags: apiTags,
};

const api = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: './src/data/api',
  }),
  schema: z
    .object({
      schemaVersion: z.literal(2),
      displayName: z.string(),
      defaultFramework: z.literal('react'),
      frameworks: z
        .object({
          react: z
            .object({
              ...frameworkBase,
              methods: z.array(z.unknown()),
              props: z.record(z.string(), apiMember),
            })
            .strict(),
          angular: z
            .object({
              ...frameworkBase,
              inputs: z.record(z.string(), apiMember),
              outputs: z.record(z.string(), apiMember),
              content: z
                .record(
                  z.string(),
                  z
                    .object({
                      name: z.string(),
                      selector: z.string(),
                      description: z.string(),
                    })
                    .strict(),
                )
                .optional(),
            })
            .strict()
            .optional(),
        })
        .strict(),
    })
    .strict(),
});

// Collection dédiée aux pages de contenu (MD/MDX) avec sous-dossiers
const pages = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/data/pages',
  }),
});

export const collections = { overviews, api, pages };
