import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

export const prerender = true;

export async function getStaticPaths() {
  const pages = await getCollection('pages');

  return pages.map((page) => {
    let url = page.filePath!.replace(/\.(md|mdx)$/, '');
    url = url.replace(/\/index$/, '');
    url = url.replace('src/data/pages/', '/');

    return {
      params: { url: url },
      props: { page },
    };
  });
}

export const GET: APIRoute = async ({ props }) => {
  const { page } = props as { page: CollectionEntry<'pages'> };
  const body = page.body ?? '';

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
