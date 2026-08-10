import type { ShikiTransformer } from 'shiki';
import type { ElementContent } from 'hast';

/**
 * Transformers Shiki reprenant les annotations qu'apportait expressive-code
 * (`del` / `ins` / `mark`). Les styles sont posés en classes Tailwind directement
 * dans le hast : elles apparaissent en littéral dans ce fichier, donc le scanner
 * Tailwind les voit et aucune feuille CSS n'est nécessaire.
 */

/** `'3-5'` ou `'4,6,15'` → `[3,4,5]` / `[4,6,15]`. */
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

/** Surligne des lignes entières : rouge barré pour `del`, vert pour `ins`. */
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
 * Surligne des mots à l'intérieur des tokens. Un token Shiki comme
 * `"text-headline-small font-bold"` est un seul nœud texte : on le redécoupe pour
 * n'encadrer que le mot visé.
 */
export function transformerMarkWords(words: string[]): ShikiTransformer {
  const escaped = words
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    // Le plus long d'abord, sinon `text-on-surface` capterait le début de
    // `text-on-surface-variant` et le suffixe resterait en clair.
    .sort((a, b) => b.length - a.length);

  return {
    name: 'udixio:mark-words',
    span(node, _line, _col, _lineElement, token) {
      // Un token peut contenir plusieurs mots visés (`class="… bg-primary-container
      // text-on-primary-container …"`), d'où un découpage global plutôt qu'un
      // seul `find`. Le groupe capturant conserve les séparateurs dans le split :
      // les index impairs sont les correspondances.
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
