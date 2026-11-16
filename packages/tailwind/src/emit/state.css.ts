// Values copied from the previous Tailwind plugin (plugins-tailwind/state.ts): disabled text opacity 0.38,
// disabled background opacity 0.1. The colour fade is the short3 token (150 ms) on the standard curve of the motion
// tokens, so it matches the rest of the library; `--udx-motion-*` falls back to these values without motion.css.
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
        `@apply transition-[color,background-color,border-color,fill,stroke];`,
        `@apply duration-[var(--udx-motion-duration-short3,150ms)] ease-[var(--udx-motion-easing-standard,cubic-bezier(0.2,0,0,1))];`,
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
