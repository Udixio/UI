// Values copied verbatim from the previous Tailwind plugin
// (plugins-tailwind/state.ts): duration 150ms, disabled text opacity 0.38,
// disabled background opacity 0.1. The @apply bodies are reproduced exactly so
// Tailwind resolves them into the same declarations as before.
const DURATION = 150;
const TEXT_OPACITY = 0.38;
const BG_OPACITY = 0.1;

/**
 * Static state utilities: `state-layer` (a single, parameter-free utility) and
 * `state-{colorKey}` (the `--state-color` setter, enumerated over the theme's
 * color keys as the previous plugin did via `matchUtilities`).
 *
 * NOTE: `state-group` / `state-ripple-group` are deliberately NOT here — they
 * take an optional arbitrary group name (`state-ripple-group-[button]`) that
 * interpolates into a group variant (`group-hover/button:`), which a static
 * `@utility` cannot express. They live in the `stateGroup` Tailwind plugin
 * (`plugins-tailwind/state-group.ts`), wired through `@plugin "@udixio/tailwind"`.
 */
export function stateCss(colorKeys: string[]): string {
  const blocks: string[] = [];

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
