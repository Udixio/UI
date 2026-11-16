import plugin, { PluginAPI } from 'tailwindcss/plugin';

// Values copied from the previous state plugin: disabled text opacity 0.38, disabled background opacity 0.1. The colour
// fade is the short3 token (150 ms) on the standard curve of the motion tokens, as in `emit/state.css.ts`.
const TEXT_OPACITY = 0.38;
const BG_OPACITY = 0.1;

const groupBody = (groupName: string, includeActive: boolean) => {
  const gv = groupName ? `/${groupName}` : '';
  return {
    [`@apply group-hover${gv}:bg-[var(--state-color)]/[0.08]`]: {},
    ...(includeActive
      ? { [`@apply group-active${gv}:bg-[var(--state-color)]/[0.10]`]: {} }
      : {}),
    [`@apply group-focus-visible${gv}:bg-[var(--state-color)]/[0.10]`]: {},
    [`@apply transition-[color,background-color,border-color,fill,stroke]`]: {},
    [`@apply duration-[var(--udx-motion-duration-short3,150ms)] ease-[var(--udx-motion-easing-standard,cubic-bezier(0.2,0,0,1))]`]: {},
    [`@apply group-disabled${gv}:text-on-surface/[${TEXT_OPACITY}]`]: {},
    [`@apply group-disabled${gv}:bg-on-surface/[${BG_OPACITY}]`]: {},
  };
};

/**
 * `state-group` / `state-ripple-group` utilities. These MUST stay a JS plugin
 * (not static `@utility`): the optional arbitrary value interpolates into a
 * group variant name — `state-ripple-group-[button]` → `group-hover/button:…` —
 * which a static utility cannot express. Component roots are named groups
 * (`group/button`), so the scoped variant is required for the state layer to
 * respond. Config-less: uses only fixed opacities and the `--state-color` var.
 */
export const stateGroup = plugin(({ matchUtilities }: PluginAPI) => {
  matchUtilities(
    { 'state-group': (groupName: string) => groupBody(groupName, true) },
    { values: { DEFAULT: '' } },
  );
  matchUtilities(
    {
      'state-ripple-group': (groupName: string) => groupBody(groupName, false),
    },
    { values: { DEFAULT: '' } },
  );
});
