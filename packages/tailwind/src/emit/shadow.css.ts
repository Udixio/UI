// Box-shadow values copied verbatim from the previous Tailwind plugin
// (plugins-tailwind/shadow.ts) to preserve behavior exactly.
const SHADOWS: Record<string, string> = {
  shadow: '0 4px 10px #00000008, 0 0 2px #0000000f, 0 2px 6px #0000001f',
  'shadow-1':
    '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
  'shadow-2':
    '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
  'shadow-3':
    '0px 1px 3px 0px rgba(0, 0, 0, 0.30), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
  'shadow-4':
    '0px 2px 3px 0px rgba(0, 0, 0, 0.30), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
  'box-shadow-5':
    '0px 4px 4px 0px rgba(0, 0, 0, 0.30), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
};

/**
 * Shadow utilities as a static CSS string, emitted into the generated theme
 * CSS. `@utility` (rather than plain classes) preserves Tailwind variant
 * support (e.g. `hover:shadow-1`).
 */
export function shadowCss(): string {
  return Object.entries(SHADOWS)
    .map(([name, value]) => `@utility ${name} {\n  box-shadow: ${value};\n}`)
    .join('\n');
}
