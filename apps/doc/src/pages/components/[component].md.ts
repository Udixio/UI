import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildComponentMarkdown } from '@/lib/component-markdown';
import { findOverview, frameworkVariants } from '@/lib/component-md-routes';
import type { ExampleFramework } from '@/stores/exampleFrameworkStore';

export const prerender = true;

/**
 * Consolidated document — overview and API in a single fetch. It has no HTML
 * counterpart (`/components/<name>` only redirects to the overview); the
 * per-page mirrors live in `[component]/[view].md.ts`.
 */
export async function getStaticPaths() {
  const apis = await getCollection('api');
  const overviews = await getCollection('overviews');

  return apis.flatMap((api) => {
    const overviewBody = findOverview(overviews, api.id)?.body;

    return frameworkVariants(api.data).map((variant) => ({
      params: { component: `${api.id}${variant.suffix}` },
      props: { api, overviewBody, frameworks: variant.frameworks },
    }));
  });
}

export const GET: APIRoute = async ({ props }) => {
  const { api, overviewBody, frameworks } = props as {
    api: CollectionEntry<'api'>;
    overviewBody: string | undefined;
    frameworks: readonly ExampleFramework[];
  };

  const markdown = buildComponentMarkdown(api.data, overviewBody, { frameworks });

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
