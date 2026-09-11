import type { CollectionEntry } from 'astro:content';
import type { NavSection } from '@/components/Sidebar';

type ApiEntry = CollectionEntry<'api'>;
type OverviewEntry = CollectionEntry<'overviews'>;

/**
 * Sidebar sections for the "Components" flyout: every documented, top-level
 * component (has an overview page, is not a sub-component) grouped by
 * category, both categories and labels sorted alphabetically.
 */
export function buildComponentSections(
  apis: ApiEntry[],
  overviews: OverviewEntry[],
): NavSection[] {
  const overviewIds = new Set(
    overviews.map((overview) => overview.id.replaceAll('overview', '')),
  );

  const byCategory = new Map<string, { slug: string; label: string }[]>();

  for (const entry of apis) {
    const react = entry.data.frameworks.react;
    if (react.tags.parent || !overviewIds.has(entry.id)) continue;

    const category = react.tags.category ?? 'Other';
    const bucket = byCategory.get(category) ?? [];
    bucket.push({ slug: entry.id, label: entry.data.displayName });
    byCategory.set(category, bucket);
  }

  return [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({
      category,
      pages: items
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(({ slug, label }) => ({
          slug,
          label,
          href: `/components/${slug}/overview`,
        })),
    }));
}
