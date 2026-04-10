import { type API, type ConfigInterface, loader } from '@udixio/theme';
import { TailwindPlugin } from '@udixio/tailwind';

/**
 * Generates the full theme CSS string from a config object.
 *
 * Accepts the output of `defineConfig()` — TailwindPlugin and FontPlugin must
 * already be wired (which `defineConfig` does automatically).
 *
 * The optional `onApi` callback runs after initialization but before the first
 * load, allowing palette overrides, context updates, or any other API
 * manipulation (e.g. applying a user-persisted dark mode preference or a
 * tenant-specific palette from a server-side cookie).
 *
 * @example SSR with user preference
 * ```ts
 * const css = await generateThemeCss(config, (api) => {
 *   api.context.update({ isDark: userPrefersDark });
 * });
 * ```
 *
 * @example Tenant-specific palette
 * ```ts
 * const css = await generateThemeCss(config, (api) => {
 *   api.palettes.sync({ primary: () => ({ hue: tenant.hue, chroma: 36 }) });
 * });
 * ```
 */
export async function generateThemeCss(
  config: ConfigInterface,
  onApi?: (api: API) => void | Promise<void>,
): Promise<string> {
  const api = await loader(config, false);
  await onApi?.(api);
  await api.load();
  return api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss;
}
