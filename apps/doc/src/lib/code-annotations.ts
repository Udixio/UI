import type { ShikiTransformer } from 'shiki';
import type { ElementContent } from 'hast';

/**
 * Shiki transformers reproducing the annotations expressive-code provided
 * (`del` / `ins` / `mark`). Styles are set as Tailwind classes directly in the
 * hast: they appear literally in this file, so the Tailwind scanner sees them
 * and no stylesheet is needed.
 */

/** `'3-5'` or `'4,6,15'` → `[3,4,5]` / `[4,6,15]`. */
export function parseLines(spec: string): number[] {
  const lines: number[] = [];

  for (const part of spec.split(',')) {
    const range = part.trim().split('-').map(Number);
    if (range.length === 2) {
      const [from, to] = range;
      for (let i = from; i <= to; i++) lines.push(i);
    } else if (Number.isFinite(range[0])) {
      lines.push(range[0]);
    }
  }

  return lines;
}

/** Highlights whole lines: red strikethrough for `del`, green for `ins`. */
export function transformerDiffLines(spec: {
  del?: string;
  ins?: string;
}): ShikiTransformer {
  const del = spec.del ? parseLines(spec.del) : [];
  const ins = spec.ins ? parseLines(spec.ins) : [];

  return {
    name: 'udixio:diff-lines',
    line(node, line) {
      if (del.includes(line)) {
        this.addClassToHast(node, 'block bg-error-container/25 line-through');
      } else if (ins.includes(line)) {
        this.addClassToHast(node, 'block bg-success-container/25');
      }
    },
  };
}

/**
 * Highlights words inside tokens. A Shiki token such as
 * `"text-headline-small font-bold"` is a single text node: it is split again so
 * that only the targeted word gets wrapped.
 */
export function transformerMarkWords(words: string[]): ShikiTransformer {
  const escaped = words
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    // Longest first, otherwise `text-on-surface` would capture the start of
    // `text-on-surface-variant` and the suffix would stay unhighlighted.
    .sort((a, b) => b.length - a.length);

  return {
    name: 'udixio:mark-words',
    span(node, _line, _col, _lineElement, token) {
      // A token can hold several targeted words (`class="… bg-primary-container
      // text-on-primary-container …"`), hence a global split rather than a
      // single `find`. The capturing group keeps the separators in the split:
      // odd indexes are the matches.
      const parts = token.content.split(new RegExp(`(${escaped.join('|')})`, 'g'));
      if (parts.length < 2) return;

      return {
        ...node,
        children: parts.flatMap((part, index): ElementContent[] => {
          if (!part) return [];
          return index % 2 === 1
            ? [
                {
                  type: 'element' as const,
                  tagName: 'span',
                  properties: {
                    class:
                      'rounded-sm bg-warning-container px-0.5 text-on-warning-container',
                  },
                  children: [{ type: 'text' as const, value: part }],
                },
              ]
            : [{ type: 'text' as const, value: part }];
        }),
      };
    },
  };
}
