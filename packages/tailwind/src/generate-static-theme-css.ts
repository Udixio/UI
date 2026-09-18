import {
  type API,
  type ConfigInterface,
  loader,
  type PluginAbstract,
} from '@udixio/theme';
import {
  TailwindImplPluginBrowser,
  type TailwindPluginOptions,
} from './browser/tailwind.plugin';

type AnyTailwindPlugin = PluginAbstract<
  TailwindImplPluginBrowser,
  TailwindPluginOptions
>;

/**
 * The config's TailwindPlugin, whichever build (node or browser) produced it:
 * both implementations derive from `TailwindImplPluginBrowser`, which owns
 * `emitStaticCss()`.
 */
export function findTailwindPlugin(
  config: ConfigInterface,
): AnyTailwindPlugin | undefined {
  return config.plugins?.find(
    (plugin): plugin is AnyTailwindPlugin =>
      plugin.pluginClass === TailwindImplPluginBrowser ||
      plugin.pluginClass?.prototype instanceof TailwindImplPluginBrowser,
  );
}

/**
 * Generates the full **static** theme CSS as a string — the exact content the
 * `udixio-theme` CLI / bundler plugins write to `udixio.generated.css`
 * (`@theme` colors, font/state/shadow utilities, `@plugin "@udixio/tailwind"`),
 * without touching the filesystem.
 *
 * Use it from your own build script when neither the CLI nor a bundler plugin
 * fits (custom pipelines, monorepo tooling, emitting several themes at once).
 * For SSR / runtime colors-only CSS, use `generateThemeCss` from
 * `@udixio/ui-react` instead.
 *
 * Accepts the output of `defineConfig()` — TailwindPlugin and FontPlugin must
 * already be wired (which `defineConfig` does automatically). The caller's
 * plugin options are left untouched.
 *
 * Available from the browser build as well: nothing here reaches Node.
 *
 * The optional `onApi` callback runs after initialization but before the first
 * load, allowing palette overrides, context updates, or any other API
 * manipulation.
 *
 * @example Build script
 * ```ts
 * import { writeFileSync } from 'node:fs';
 * import { generateStaticThemeCss } from '@udixio/tailwind';
 * import config from './theme.config';
 *
 * writeFileSync('src/udixio.generated.css', await generateStaticThemeCss(config));
 * ```
 */
export async function generateStaticThemeCss(
  config: ConfigInterface,
  onApi?: (api: API) => void | Promise<void>,
): Promise<string> {
  // Run the load in SSR mode so the node plugin skips its file write (and
  // .gitignore edit), then rebuild the full static CSS from the loaded state.
  const tailwind = findTailwindPlugin(config);
  if (!tailwind) {
    throw new Error(
      'generateStaticThemeCss: config has no TailwindPlugin — use defineConfig() or add `new TailwindPlugin()` to `plugins`.',
    );
  }
  const originalOptions = tailwind.options;
  tailwind.options = { ...originalOptions, ssr: true };
  try {
    const api = await loader(config, false);
    await onApi?.(api);
    await api.load();
    const instance = tailwind.getInstance();
    instance.emitStaticCss();
    return instance.outputCss;
  } finally {
    tailwind.options = originalOptions;
  }
}
