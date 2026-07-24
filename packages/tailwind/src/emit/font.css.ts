import type { FontRole, FontSize, FontStyle } from '@udixio/theme';

export interface FontCssArgs {
  fontStyles: Record<FontRole, Record<FontSize, FontStyle>>;
  responsiveBreakPoints: Record<string, number>;
  fontFamily: { expressive: string[]; neutral: string[] };
}

/**
 * Typography utilities (`.text-{role}-{size}`) as a static CSS string.
 *
 * Emitted as `@utility` so Tailwind variants keep working. Responsive scaling
 * uses `@media (min-width: theme(--breakpoint-<name>))`, which Tailwind v4
 * resolves inside a nested `@media` (validated in the Task 1 spike) — this
 * preserves the previous plugin's use of `theme('screens.*')` and therefore
 * honors any custom breakpoint the consumer configures.
 */
export function fontCss({
  fontStyles,
  responsiveBreakPoints,
  fontFamily,
}: FontCssArgs): string {
  const family = (key: string) =>
    (fontFamily[key as keyof typeof fontFamily] ?? [])
      .map((f) => (f.trim().startsWith('var(') ? f : `"${f}"`))
      .join(', ');

  const blocks: string[] = [];
  for (const [role, sizes] of Object.entries(fontStyles)) {
    for (const [size, style] of Object.entries(
      sizes as Record<string, FontStyle>,
    )) {
      const decls = [
        `font-size: ${style.fontSize}rem;`,
        `font-weight: ${style.fontWeight};`,
        `line-height: ${style.lineHeight}rem;`,
        style.letterSpacing ? `letter-spacing: ${style.letterSpacing}rem;` : '',
        `font-family: ${family(style.fontFamily as string)};`,
      ].filter(Boolean);

      const media = Object.entries(responsiveBreakPoints)
        .map(
          ([bp, ratio]) =>
            `  @media (min-width: theme(--breakpoint-${bp})) {\n` +
            `    font-size: ${style.fontSize * ratio}rem;\n` +
            `    line-height: ${style.lineHeight * ratio}rem;\n` +
            `  }`,
        )
        .join('\n');

      blocks.push(
        `@utility text-${role}-${size} {\n  ${decls.join('\n  ')}\n${media}\n}`,
      );
    }
  }
  return blocks.join('\n');
}
