import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildCatalogMarkdown } from '@/lib/component-catalog';

export const prerender = true;

/**
 * Markdown mirror of the `/components` index: the catalog an agent reads to
 * discover which components exist before fetching any single one.
 */
export const GET: APIRoute = async () => {
  const apis = await getCollection('api');

  return new Response(buildCatalogMarkdown(apis), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
