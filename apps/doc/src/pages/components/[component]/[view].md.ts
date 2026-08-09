import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import {
  buildComponentMarkdown,
  type MarkdownSection,
} from '@/lib/component-markdown';
import { findOverview, frameworkVariants } from '@/lib/component-md-routes';
import type { ExampleFramework } from '@/stores/exampleFrameworkStore';

export const prerender = true;

/**
 * Markdown mirrors of the component HTML pages: `/components/<name>/overview`
 * and `/components/<name>/api` each answer at the same URL suffixed with `.md`,
 * plus their per-framework variants (`overview.angular.md`).
 */
export async function getStaticPaths() {
  const apis = await getCollection('api');
  const overviews = await getCollection('overviews');

  return apis.flatMap((api) => {
    const overview = findOverview(overviews, api.id);
    // Only components with an overview entry get an `/overview` HTML page, so
    // only they get an `overview.md`.
    const views: Array<{ section: MarkdownSection; overviewBody?: string }> = [
      ...(overview ? [{ section: 'overview' as const, overviewBody: overview.body }] : []),
      { section: 'api' as const },
    ];

    return views.flatMap((view) =>
      frameworkVariants(api.data).map((variant) => ({
        params: { component: api.id, view: `${view.section}${variant.suffix}` },
        props: {
          api,
          overviewBody: view.overviewBody,
          sections: [view.section],
          frameworks: variant.frameworks,
        },
      })),
    );
  });
}

export const GET: APIRoute = async ({ props }) => {
  const { api, overviewBody, sections, frameworks } = props as {
    api: CollectionEntry<'api'>;
    overviewBody: string | undefined;
    sections: readonly MarkdownSection[];
    frameworks: readonly ExampleFramework[];
  };

  const markdown = buildComponentMarkdown(api.data, overviewBody, {
    sections,
    frameworks,
  });

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
