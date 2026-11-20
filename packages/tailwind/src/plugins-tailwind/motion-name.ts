import plugin, { PluginAPI } from 'tailwindcss/plugin';

/**
 * `motion-[name]` and `motion-none`: set `--udx-motion`, the motion an element
 * plays at each trigger in place of its own (see `@udixio/motion`, "Motion per
 * breakpoint"). A matched utility, so every variant applies:
 * `md:motion-[fade]`, `hover:motion-none`.
 *
 * The name is written as given. A name the motion package does not define of
 * the same kind is ignored at runtime, so nothing is checked here. Motion names
 * are not theme values, hence the arbitrary form only.
 */
export const motionName = plugin(({ matchUtilities }: PluginAPI) => {
  matchUtilities(
    { motion: (name: string) => ({ '--udx-motion': name }) },
    { values: { none: 'none' } },
  );
});
