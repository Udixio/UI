import type { CollectionEntry } from 'astro:content';
import { availableFrameworks } from '@/lib/component-md-routes';

type ApiEntry = CollectionEntry<'api'>;

/** Categories first, in reading order; anything uncategorized lands in `OTHER`. */
const CATEGORY_ORDER = [
  'Action',
  'Input',
  'Selection',
  'Navigation',
  'Communication',
  'Layout',
] as const;

const OTHER = 'Other';

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

/**
 * The description's first sentence — enough to recognize a component when
 * scanning for an equivalent, without the full prose of its own page.
 */
function summary(description: string): string {
  const collapsed = description.replace(/\s+/g, ' ').trim();
  const match = /^(.*?\.)(?:\s|$)/.exec(collapsed);
  return match ? match[1] : collapsed;
}

function row(entry: ApiEntry): string {
  const { data } = entry;
  const react = data.frameworks.react;
  const parent = react.tags.parent;
  const name = parent
    ? `**${data.displayName}** (part of \`${parent}\`)`
    : `**${data.displayName}**`;
  const frameworks = availableFrameworks(data).join(', ');

  return `| ${name} | \`${entry.id}\` | ${react.tags.status ?? '—'} | ${frameworks} | ${cell(summary(react.description))} |`;
}

/**
 * A single markdown catalog of every documented component, grouped by category.
 * Agents looking for the Udixio equivalent of some other library's component
 * read this instead of relying on a hardcoded mapping table that would drift
 * as soon as a component is added or renamed.
 */
export function buildCatalogMarkdown(apis: ApiEntry[]): string {
  const byCategory = new Map<string, ApiEntry[]>();

  for (const entry of apis) {
    const category = entry.data.frameworks.react.tags.category ?? OTHER;
    const bucket = byCategory.get(category);
    if (bucket) bucket.push(entry);
    else byCategory.set(category, [entry]);
  }

  const known = CATEGORY_ORDER.filter((category) => byCategory.has(category));
  const extra = [...byCategory.keys()]
    .filter((category) => !CATEGORY_ORDER.includes(category as never) && category !== OTHER)
    .sort();
  const ordered = [...known, ...extra, ...(byCategory.has(OTHER) ? [OTHER] : [])];

  const parts: string[] = [
    '# Components',
    '',
    `Every documented Udixio UI component (${apis.length} total). React is always available; Angular only where listed.`,
    '',
    'For any component below, fetch its own document:',
    '',
    '- `https://ui.udixio.fr/components/<slug>.md` — guide and API together',
    '- `https://ui.udixio.fr/components/<slug>/overview.md` — usage and code examples only',
    '- `https://ui.udixio.fr/components/<slug>/api.md` — props, inputs and outputs only',
    '',
    'Insert `.react` or `.angular` before `.md` to narrow any of those to one framework, e.g. `switch/api.angular.md`.',
  ];

  for (const category of ordered) {
    const entries = (byCategory.get(category) ?? []).sort((a, b) =>
      a.data.displayName.localeCompare(b.data.displayName),
    );
    if (entries.length === 0) continue;

    parts.push(
      '',
      `## ${category}`,
      '',
      '| Component | Slug | Status | Frameworks | Description |',
      '|-----------|------|--------|------------|-------------|',
      ...entries.map(row),
    );
  }

  return parts.join('\n').trim() + '\n';
}
