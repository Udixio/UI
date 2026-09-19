// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 2. Import one or more loaders

// 3. Define your collection(s)
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

// Only a Svelte prop can be `$bindable`.
const svelteApiMember = apiMember.extend({ bindable: z.literal(true).optional() }).strict();

const frameworkBase = {
  filePath: z.string(),
  tags: apiTags,
};

const api = defineCollection({
  loader: glob({
    pattern: '**/*.json',
    base: './src/data/api',
  }),
  schema: z
    .object({
      schemaVersion: z.literal(5),
      displayName: z.string(),
      // One description, from the shared contract -- never per adapter.
      description: z.string(),
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
              // Where the members attach: `udx-tooltip` for a component,
              // `[udxTooltip]` for an attribute directive.
              selector: z.string(),
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
          svelte: z
            .object({
              ...frameworkBase,
              props: z.record(z.string(), svelteApiMember),
              snippets: z
                .record(
                  z.string(),
                  z
                    .object({
                      name: z.string(),
                      description: z.string(),
                      parameters: z.string().optional(),
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

// Collection dedicated to content pages (MD/MDX) with subfolders
const pages = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/data/pages',
  }),
});

export const collections = { overviews, api, pages };
