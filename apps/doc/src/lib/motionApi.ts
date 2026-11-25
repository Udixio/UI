import data from '@/data/motion-api.json';
import { MOTION_NEEDS } from '@/lib/motion-nav';

/** One row of a parameter, member, input or output table. */
export type ApiRow = {
  name: string;
  type: string | null;
  optional?: boolean;
  required?: boolean;
  readonly?: boolean;
  default: string | null;
  description: string;
  fields?: ApiRow[];
  property?: string;
  model?: boolean;
  deprecated?: string | boolean;
};

/** One exported symbol, as apps/doc/scripts/motion-api.mjs writes it. */
export type ApiSymbol = {
  id: string;
  name: string;
  package: string;
  entries: string[];
  framework?: 'react' | 'angular' | 'svelte';
  source: string;
  kind: 'function' | 'constant' | 'interface' | 'type' | 'directive' | 'class';
  signatures: string[];
  type?: string | null;
  resolved?: string;
  params?: ApiRow[];
  returns?: { type: string; description: string };
  members?: ApiRow[];
  selector?: string | null;
  exportAs?: string | null;
  inputs?: ApiRow[];
  outputs?: ApiRow[];
  methods?: { name: string; signature: string; description: string }[];
  description: string;
  tags: Record<string, string>;
  examples: string[];
  variants?: { entry: string; source: string; description: string }[];
  group: string;
  need: string | null;
  /** Its tier on the reference page: scripts/motion-api.groups.mjs (ESSENTIALS) tells the rule. */
  tier: ApiTier;
};

/** The two tiers of the reference: what the need pages tell the reader to write, then everything else. */
export type ApiTier = 'essential' | 'advanced';

export type ApiGroup = {
  id: string;
  title: string;
  intro: string;
  framework?: string;
  adapters?: string[];
  sections: { title: string | null; symbols: string[] }[];
};

export type ApiHtmlItem = {
  name: string;
  kind: 'attribute' | 'written' | 'css-variable' | 'tailwind';
  on: string;
  value: string;
  default?: string;
  description: string;
  equivalent: string[];
  need: string | null;
  tier: ApiTier;
};

export const api = data as unknown as {
  entries: { entry: string; source: string; exports: string[]; adapter?: string }[];
  files: { entry: string; file: string }[];
  groups: ApiGroup[];
  html: { id: string; title: string; intro: string; items: ApiHtmlItem[] };
  symbols: Record<string, ApiSymbol>;
};

/** The anchor of an HTML attribute or CSS variable. */
export const htmlAnchor = (name: string) =>
  `html-${name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`;

/** The label of the need page at `href`, from the side panel. */
export const needLabel = (href: string) => MOTION_NEEDS.find((need) => need.href === href)?.label ?? href;

/** What a symbol is, in the words of its framework: a hook, a component, an attachment, a directive. */
export function kindLabel(symbol: ApiSymbol): string {
  if (symbol.framework === 'react' && symbol.kind === 'function') {
    return symbol.name.startsWith('use') ? 'hook' : 'component';
  }
  if (symbol.framework === 'svelte' && symbol.kind === 'function') {
    return symbol.returns?.type.startsWith('Attachment') ? 'attachment' : symbol.name === 'presence' ? 'transition' : 'function';
  }
  return symbol.kind;
}

/** The import line of a symbol, from its first entry. */
export function importLine(symbol: ApiSymbol): string {
  const typeOnly = symbol.kind === 'interface' || symbol.kind === 'type';
  return `import ${typeOnly ? 'type ' : ''}{ ${symbol.name} } from '${symbol.entries[0]}';`;
}

/** A piece of text: plain, inline code, or a link to a symbol. */
export type Segment = { text: string; code?: boolean; href?: string };

/** The anchor a name refers to from a symbol: the symbol of the same adapter first, else the one of @udixio/motion. */
export function anchorOf(name: string, framework?: string): string | undefined {
  if (framework && api.symbols[`${framework}-${name}`]) return `${framework}-${name}`;
  if (api.symbols[`api-${name}`]) return `api-${name}`;
  return undefined;
}

/** A type, cut into its words, each name of an exported symbol linked to it. */
export function typeSegments(type: string, framework?: string, self?: string): Segment[] {
  return type.split(/(\b[A-Za-z_$][\w$]*\b)/).filter(Boolean).map((text) => {
    const anchor = /^[A-Z]/.test(text) ? anchorOf(text, framework) : undefined;
    return anchor && anchor !== self ? { text, href: `#${anchor}` } : { text };
  });
}

/** Inline text: the `code` spans of TSDoc, and `{@link Name}`, which links when it names an export. */
export function inline(text: string, framework?: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /`([^`]+)`|\{@link\s+([^}\s|]+)(?:\s*\|\s*([^}]+))?\}/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) segments.push({ text: text.slice(last, match.index) });
    if (match[1] !== undefined) {
      const anchor = /^[A-Za-z_$][\w$]*$/.test(match[1]) ? anchorOf(match[1], framework) : undefined;
      segments.push({ text: match[1], code: true, ...(anchor ? { href: `#${anchor}` } : {}) });
    } else {
      const anchor = anchorOf(match[2], framework);
      segments.push({ text: match[3] ?? match[2], code: true, ...(anchor ? { href: `#${anchor}` } : {}) });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}

/** A block of TSDoc prose: a paragraph, or a list of the lines that start with `-`. */
export type Block = { list: false; segments: Segment[] } | { list: true; items: Segment[][] };

/** TSDoc prose as paragraphs and lists: blank lines part paragraphs, `- ` starts an item, other lines join. */
export function blocks(text: string, framework?: string): Block[] {
  const result: Block[] = [];
  for (const chunk of text.split(/\n\s*\n/)) {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;
    let paragraph: string[] = [];
    let items: string[] | null = null;
    const flush = () => {
      if (paragraph.length) result.push({ list: false, segments: inline(paragraph.join(' '), framework) });
      paragraph = [];
      if (items) result.push({ list: true, items: items.map((item) => inline(item, framework)) });
      items = null;
    };
    for (const line of lines) {
      if (line.startsWith('- ')) {
        if (paragraph.length) {
          result.push({ list: false, segments: inline(paragraph.join(' '), framework) });
          paragraph = [];
        }
        (items ??= []).push(line.slice(2));
      } else if (items) {
        items[items.length - 1] += ` ${line}`;
      } else {
        paragraph.push(line);
      }
    }
    flush();
  }
  return result;
}

/** The first sentence of a description, for the table of contents and the cells that need one line. */
export function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const match = flat.match(/^(.+?[.!?])(?:\s|$)/);
  return match ? match[1] : flat;
}

/** The description of a row; a parameter with none borrows the first sentence of the type it takes. */
export function rowDescription(row: ApiRow, framework?: string): string {
  if (row.description) return row.description;
  const anchor = row.type && /^[A-Z][\w$]*(?:<.*>)?$/.test(row.type) ? anchorOf(row.type.replace(/<.*$/, ''), framework) : undefined;
  const target = anchor ? api.symbols[anchor] : undefined;
  return target?.description ? firstSentence(target.description) : '';
}

/** The tags shown under a description, in this order, with their headings. */
export const NOTE_TAGS: [string, string][] = [
  ['devx', 'Usage'],
  ['a11y', 'Accessibility'],
  ['limitations', 'Limitations'],
  ['remarks', 'Remarks'],
  ['deprecated', 'Deprecated'],
];

/** The symbols of every group, in the order of the page. */
export const orderedSymbols = (): ApiSymbol[] =>
  api.groups.flatMap((group) => group.sections.flatMap((section) => section.symbols.map((id) => api.symbols[id]!)));

/**
 * A description cut into its summary, the first sentence of its first paragraph (the line the reference shows while the
 * entry is folded), and the rest (what the open entry adds). A description that opens with a list has no summary.
 */
export function splitSummary(text: string): { summary: string; rest: string } {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith('- ')) return { summary: '', rest: trimmed };
  const paragraph = trimmed.split(/\n\s*\n/)[0]!;
  const match = paragraph.match(/^([\s\S]+?[.!?])(?=\s|$)/);
  // A first line that runs into a list (`…:\n- item`) stays whole: the summary is the paragraph up to the list.
  const head = match ? match[1]! : paragraph.split(/\n\s*-\s/)[0]!;
  if (/\n\s*-\s/.test(head)) return { summary: '', rest: trimmed };
  return { summary: head.replace(/\s+/g, ' ').trim(), rest: trimmed.slice(head.length).trim() };
}

/** The blocks of a tier, in the order the server renders them: React, the shared core, then Angular, Svelte and HTML. */
export const API_FRAMEWORKS = ['react', 'angular', 'svelte', 'html'] as const;
export type ApiBlockKey = (typeof API_FRAMEWORKS)[number] | 'core';

export type ApiTierSection = { title: string | null; symbols: ApiSymbol[] };
export type ApiTierGroup = { id: string; title: string; intro: string; adapters?: string[]; sections: ApiTierSection[]; count: number };
export type ApiTierBlock =
  | { key: Exclude<ApiBlockKey, 'html'>; groups: ApiTierGroup[] }
  | { key: 'html'; group: { id: string; title: string; intro: string; items: ApiHtmlItem[] } };

/**
 * The blocks of a tier: one per framework (its adapter group, or the HTML attributes) and one for the core, whose groups
 * are the tasks of @udixio/motion. A group, a section or a block with nothing in the tier is left out.
 */
export function tierBlocks(tier: ApiTier): ApiTierBlock[] {
  const groupOf = (group: ApiGroup): ApiTierGroup => {
    const sections = group.sections
      .map((section) => ({ title: section.title, symbols: section.symbols.map((id) => api.symbols[id]!).filter((symbol) => symbol.tier === tier) }))
      .filter((section) => section.symbols.length > 0);
    return {
      id: `${tier === 'essential' ? 'essentials' : 'advanced'}-${group.id}`,
      title: group.title,
      intro: group.intro,
      ...(group.adapters ? { adapters: group.adapters } : {}),
      sections,
      count: sections.reduce((count, section) => count + section.symbols.length, 0),
    };
  };
  const adapter = (framework: 'react' | 'angular' | 'svelte'): ApiTierBlock => ({
    key: framework,
    groups: api.groups.filter((group) => group.framework === framework).map(groupOf).filter((group) => group.count > 0),
  });
  const items = api.html.items.filter((item) => item.tier === tier);
  const blocks: ApiTierBlock[] = [
    adapter('react'),
    { key: 'core', groups: api.groups.filter((group) => !group.framework).map(groupOf).filter((group) => group.count > 0) },
    adapter('angular'),
    adapter('svelte'),
    { key: 'html', group: { id: `${tier === 'essential' ? 'essentials' : 'advanced'}-${api.html.id}`, title: api.html.title, intro: api.html.intro, items } },
  ];
  return blocks.filter((block) => (block.key === 'html' ? block.group.items.length > 0 : block.groups.length > 0));
}

/** Every entry of the reference: the exports and the HTML attributes. */
export const apiEntryCount = Object.keys(api.symbols).length + api.html.items.length;
