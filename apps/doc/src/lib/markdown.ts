import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import sanitizeHtml, { type IOptions as SanitizeOptions } from 'sanitize-html';

export type ClassMap = Record<string, string | string[]>;

/**
 * Rehype plugin to add class names to elements by tag name.
 * Example: { ul: 'list-disc pl-6', li: ['mt-1', 'text-sm'] }
 */
function rehypeAddClasses(classMap: ClassMap) {
  return function transformer(tree: any) {
    function visit(node: any) {
      if (!node || typeof node !== 'object') return;
      const tag = node.type === 'element' ? node.tagName : undefined;
      if (tag && classMap[tag]) {
        const existing = node.properties?.className ?? [];
        const toAdd = Array.isArray(classMap[tag])
          ? (classMap[tag] as string[])
          : String(classMap[tag]).split(/\s+/g).filter(Boolean);
        node.properties = node.properties || {};
        node.properties.className = Array.from(
          new Set([
            ...(Array.isArray(existing) ? existing : [existing]).filter(
              Boolean,
            ),
            ...toAdd,
          ]),
        );
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    }
    visit(tree);
  };
}

export interface RenderMarkdownOptions {
  classes?: ClassMap;
  sanitize?: SanitizeOptions;
}

/**
 * Convert markdown into sanitized HTML. Allows styling elements via a class map.
 */
export function renderMarkdown(
  markdown: string,
  options: RenderMarkdownOptions = {},
): string {
  const { classes = {}, sanitize: sanitizeOpts } = options;

  // Build HTML using unified
  const file = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeAddClasses as any, classes)
    .use(rehypeStringify)
    .processSync(markdown ?? '');

  const rawHtml = String(file);

  // Sanitize and keep classes
  const html = sanitizeHtml(rawHtml, {
    // Start with sane defaults and keep classes globally
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'img',
      'figure',
      'figcaption',
      'code',
      'pre',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
    },
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    allowedClasses: {
      '*': [/^.+$/], // allow any class name
    },
    // Merge user overrides
    ...(sanitizeOpts || {}),
  });

  return html;
}
