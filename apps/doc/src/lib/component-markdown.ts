import type { CollectionEntry } from 'astro:content';
import type { ExampleFramework } from '@/stores/exampleFrameworkStore';

type ApiData = CollectionEntry<'api'>['data'];
type ApiTags = ApiData['frameworks']['react']['tags'];
type ApiMember = ApiData['frameworks']['react']['props'][string];

export const ALL_FRAMEWORKS: ExampleFramework[] = ['react', 'angular'];

const TAG_LABELS: Array<[key: keyof ApiTags, label: string]> = [
  ['status', 'Status'],
  ['category', 'Category'],
  ['devx', 'Devx'],
  ['a11y', 'Accessibility'],
  ['limitations', 'Limitations'],
];

/**
 * Raw sources of every runnable example, keyed by their path below
 * `src/examples/`. Live demos cannot survive the trip to plain markdown, but
 * their sources can: overviews import them with `?raw` to feed `<Code>`, and
 * the same strings are re-emitted here as fenced code blocks.
 */
const exampleSources = import.meta.glob('../examples/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const EXAMPLES_ROOT = 'examples/';

/** Reduces any spelling of an example path (`@/examples/…`, `../examples/…`) to `examples/…`. */
function exampleKey(path: string): string {
  const index = path.lastIndexOf(EXAMPLES_ROOT);
  return index === -1 ? path : path.slice(index);
}

const sourcesByExample = new Map(
  Object.entries(exampleSources).map(([path, source]) => [exampleKey(path), source]),
);

const FRAMEWORK_LABELS: Record<string, string> = {
  react: 'React',
  angular: 'Angular',
};

const RAW_IMPORT_RE = /^import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)\?raw['"]/;
const CODES_PROP_RE = /codes=\{\{([\s\S]*?)\}\}/;
const CODES_ENTRY_RE = /([A-Za-z][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)/g;

function languageFor(specifier: string): string {
  if (specifier.endsWith('.tsx')) return 'tsx';
  if (specifier.endsWith('.ts')) return 'ts';
  return 'text';
}

/**
 * Maps the local name of every `?raw` example import to its module specifier,
 * e.g. `buttonVariantsReactSource` -> `@/examples/react/button-variants.tsx`.
 */
function collectRawImports(lines: string[]): Map<string, string> {
  const imports = new Map<string, string>();
  let inFence = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = RAW_IMPORT_RE.exec(trimmed);
    if (match) imports.set(match[1], match[2]);
  }

  return imports;
}

/**
 * Turns a `<Code codes={{ react: xSource, angular: ySource }}>…</Code>` block
 * into one labelled fenced code block per requested framework. Returns an empty
 * string when none of the referenced sources can be resolved.
 */
function renderCodeExample(
  block: string,
  rawImports: Map<string, string>,
  frameworks: readonly string[],
): string {
  const propMatch = CODES_PROP_RE.exec(block);
  if (!propMatch) return '';

  const parts: string[] = [];
  for (const [, framework, identifier] of propMatch[1].matchAll(CODES_ENTRY_RE)) {
    if (!frameworks.includes(framework)) continue;

    const specifier = rawImports.get(identifier);
    if (!specifier) continue;

    const source = sourcesByExample.get(exampleKey(specifier));
    if (!source) continue;

    const label = FRAMEWORK_LABELS[framework] ?? framework;
    parts.push(`**${label}**`, '', `\`\`\`${languageFor(specifier)}`, source.trimEnd(), '```', '');
  }

  return parts.join('\n').trimEnd();
}

/**
 * Strips the live-MDX scaffolding (import statements and `<Code>` demo
 * wrappers) out of an `overviews` entry's raw body so it reads as plain
 * markdown, replacing each `<Code>` demo with the source of the example it
 * renders, restricted to `frameworks`. Content inside fenced code blocks is
 * left untouched, since component-looking lines there are illustrative code
 * samples, not MDX.
 */
export function sanitizeOverviewBody(
  body: string,
  frameworks: readonly string[] = ALL_FRAMEWORKS,
): string {
  const lines = body.split('\n');
  const rawImports = collectRawImports(lines);
  const out: string[] = [];
  let inFence = false;
  let closingTag = '';
  let block: string[] | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      out.push(rawLine);
      continue;
    }

    if (inFence) {
      out.push(rawLine);
      continue;
    }

    if (closingTag) {
      block?.push(rawLine);
      if (trimmed === closingTag) {
        const rendered = block
          ? renderCodeExample(block.join('\n'), rawImports, frameworks)
          : '';
        if (rendered) out.push(rendered);
        closingTag = '';
        block = null;
      }
      continue;
    }

    // Opening tag of a live demo wrapper, e.g. `<Code codes={{ ... }}>`.
    const openingTag = /^<([A-Z][A-Za-z0-9]*)(\s|>|$)/.exec(trimmed);
    if (openingTag && !trimmed.endsWith('/>')) {
      closingTag = `</${openingTag[1]}>`;
      // Only `<Code>` carries sources worth keeping; other wrappers are dropped.
      block = openingTag[1] === 'Code' ? [rawLine] : null;
      continue;
    }

    // Self-closing live demo children, e.g. `<ButtonVariantsReact ... />`.
    if (/^<[A-Z][A-Za-z0-9]*.*\/>$/.test(trimmed)) {
      continue;
    }

    if (/^import\s.+/.test(trimmed)) {
      continue;
    }

    out.push(rawLine);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function renderMembersTable(members: Record<string, ApiMember>): string {
  const entries = Object.values(members);
  if (entries.length === 0) return '_None._';

  const header = '| Name | Type | Required | Default | Description |';
  const divider = '|------|------|----------|---------|-------------|';
  const rows = entries.map((member) => {
    const name = member.alias
      ? `\`${member.name}\` (alias: \`${member.alias}\`)`
      : `\`${member.name}\``;
    const type = `\`${escapeCell(member.type.name)}\``;
    const required = member.required ? 'Yes' : 'No';
    const defaultValue = member.defaultValue
      ? `\`${escapeCell(member.defaultValue.value)}\``
      : '—';
    const description = escapeCell(member.description);
    return `| ${name} | ${type} | ${required} | ${defaultValue} | ${description} |`;
  });

  return [header, divider, ...rows].join('\n');
}

function renderTags(tags: ApiTags): string {
  const parts: string[] = [];
  for (const [key, label] of TAG_LABELS) {
    const value = tags[key];
    if (!value) continue;
    // Multi-line values and single bullet lines (`- ...`) read as list
    // content, not a short phrase — give them their own block instead of
    // dangling after the label on one line.
    if (value.includes('\n') || value.trim().startsWith('-')) {
      parts.push(`**${label}**\n\n${value}`);
    } else {
      parts.push(`**${label}:** ${value}`);
    }
  }
  return parts.join('\n\n');
}

function renderReactSection(react: ApiData['frameworks']['react']): string {
  const parts = ['### React', '', react.description];

  const tagsMd = renderTags(react.tags);
  if (tagsMd) parts.push('', tagsMd);

  parts.push('', '#### Props', '', renderMembersTable(react.props));

  return parts.join('\n');
}

function renderAngularSection(
  angular: NonNullable<ApiData['frameworks']['angular']>,
): string {
  const parts = ['### Angular', '', angular.description];

  const tagsMd = renderTags(angular.tags);
  if (tagsMd) parts.push('', tagsMd);

  parts.push('', '#### Inputs', '', renderMembersTable(angular.inputs));
  parts.push('', '#### Outputs', '', renderMembersTable(angular.outputs));

  return parts.join('\n');
}

export type MarkdownSection = 'overview' | 'api';

export type ComponentMarkdownOptions = {
  /** Frameworks to keep; defaults to every framework the component ships. */
  frameworks?: readonly ExampleFramework[];
  /** Sections to include; defaults to the consolidated overview + API document. */
  sections?: readonly MarkdownSection[];
};

/**
 * Builds a markdown document for a component from its `overviews` entry (if
 * any) and its structured `api` entry, narrowed to the requested sections and
 * frameworks so each `.md` route can mirror the HTML page it stands for.
 */
export function buildComponentMarkdown(
  api: ApiData,
  overviewBody: string | undefined,
  options: ComponentMarkdownOptions = {},
): string {
  const frameworks = options.frameworks ?? ALL_FRAMEWORKS;
  const wanted = options.sections ?? (['overview', 'api'] as const);
  const sections: string[] = [`# ${api.displayName}`];

  if (overviewBody && wanted.includes('overview')) {
    const cleaned = sanitizeOverviewBody(overviewBody, frameworks);
    if (cleaned) {
      const firstLine = cleaned.split('\n').find((line) => line.trim().length > 0) ?? '';
      if (/^#{1,6}\s+/.test(firstLine.trim())) {
        // The overview already opens with its own heading (every current
        // overview starts at ##, e.g. "## Usage") — wrapping it in an empty
        // "## Overview" heading would leave that heading with no content and
        // read as a sibling section rather than a parent one, so skip it.
        sections.push('', cleaned);
      } else {
        sections.push('', '## Overview', '', cleaned);
      }
    }
  }

  if (wanted.includes('api')) {
    const apiParts = ['## API'];
    if (frameworks.includes('react')) {
      apiParts.push('', renderReactSection(api.frameworks.react));
    }
    if (frameworks.includes('angular') && api.frameworks.angular) {
      apiParts.push('', renderAngularSection(api.frameworks.angular));
    }
    sections.push('', apiParts.join('\n'));
  }

  return sections.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
