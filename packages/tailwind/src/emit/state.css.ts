// Values copied verbatim from the previous Tailwind plugin
// (plugins-tailwind/state.ts): duration 150ms, disabled text opacity 0.38,
// disabled background opacity 0.1. The @apply bodies are reproduced exactly so
// Tailwind resolves them into the same declarations as before.
const DURATION = 150;
const TEXT_OPACITY = 0.38;
const BG_OPACITY = 0.1;

const groupBody = (includeActive: boolean) =>
  [
    `@apply group-hover:bg-[var(--state-color)]/[0.08];`,
    includeActive ? `@apply group-active:bg-[var(--state-color)]/[0.10];` : '',
    `@apply group-focus-visible:bg-[var(--state-color)]/[0.10];`,
    `@apply transition-colors;`,
    `@apply duration-${DURATION};`,
    `@apply group-disabled:text-on-surface/[${TEXT_OPACITY}];`,
    `@apply group-disabled:bg-on-surface/[${BG_OPACITY}];`,
  ]
    .filter(Boolean)
    .map((l) => `  ${l}`)
    .join('\n');

/**
 * State-layer utilities as a static CSS string.
 *
 * `state-group` / `state-ripple-group` / `state-layer` are single utilities;
 * `state-{colorKey}` is enumerated over the theme's color keys (the previous
 * plugin generated these via `matchUtilities` over the same key set).
 */
export function stateCss(colorKeys: string[]): string {
  const blocks: string[] = [];

  blocks.push(`@utility state-group {\n${groupBody(true)}\n}`);
  blocks.push(`@utility state-ripple-group {\n${groupBody(false)}\n}`);

  blocks.push(
    `@utility state-layer {\n` +
      [
        `@apply hover:bg-[var(--state-color)]/[0.08];`,
        `@apply active:bg-[var(--state-color)]/[0.10];`,
        `@apply focus-visible:bg-[var(--state-color)]/[0.10];`,
        `@apply transition-colors;`,
        `@apply duration-${DURATION};`,
        `@apply disabled:text-on-surface/[${TEXT_OPACITY}];`,
        `@apply disabled:bg-on-surface/[${BG_OPACITY}];`,
      ]
        .map((l) => `  ${l}`)
        .join('\n') +
      `\n}`,
  );

  for (const key of colorKeys) {
    blocks.push(
      `@utility state-${key} {\n  --state-color: var(--color-${key});\n}`,
    );
  }

  return blocks.join('\n');
}
