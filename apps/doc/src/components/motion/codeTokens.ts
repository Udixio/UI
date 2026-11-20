/**
 * The Shiki transformer of the root page's code panel (root/Principle.astro). Each token keeps its colour as a class
 * (`tok-keyword`, `tok-function`, …, coloured by the theme in Principle.astro) instead of an inline `style`, and the adjacent
 * tokens of one class become one span: the same text, the same colours, far fewer elements and bytes on the page.
 */
import type { ShikiTransformer } from 'shiki';

/** The colour Shiki's `css-variables` theme gives a token: `color:var(--astro-code-token-keyword)` or the foreground. */
const TOKEN_COLOR = /^color:var\(--astro-code-(foreground|token-[a-z-]+)\)$/;

/** A span that only carries its class (no style, no other attribute): the only kind of span that is merged. */
function isClassSpan(node: unknown): node is { tagName: 'span'; properties: { class: string }; children: unknown[] } {
  return (
    typeof node === 'object' &&
    node !== null &&
    (node as { tagName?: unknown }).tagName === 'span' &&
    typeof (node as { properties?: { class?: unknown } }).properties?.class === 'string' &&
    Object.keys((node as { properties: object }).properties).length === 1
  );
}

export const motionCodeTokens: ShikiTransformer = {
  name: 'udixio:motion-code-tokens',
  span(hast) {
    const style = hast.properties.style;
    const match = typeof style === 'string' ? TOKEN_COLOR.exec(style) : null;
    if (match === null || Object.keys(hast.properties).length !== 1) return;
    delete hast.properties.style;
    hast.properties.class = `tok-${match[1].replace(/^token-/, '')}`;
  },
  line(hast) {
    const merged: typeof hast.children = [];
    for (const child of hast.children) {
      const last = merged.at(-1);
      if (isClassSpan(child) && isClassSpan(last) && last.properties.class === child.properties.class) {
        // Text nodes are joined too, so that one token is one text node.
        const children = last.children as typeof hast.children;
        for (const node of child.children as typeof hast.children) {
          const tail = children.at(-1);
          if (node.type === 'text' && tail?.type === 'text') tail.value += node.value;
          else children.push(node);
        }
        continue;
      }
      merged.push(child);
    }
    hast.children = merged;
  },
};
