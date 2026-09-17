import { type API, type ConfigInterface, loader } from '@udixio/theme';
import { TailwindPlugin } from './tailwind.plugin';

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
  const tailwind = config.plugins?.find(
    (plugin): plugin is TailwindPlugin => plugin instanceof TailwindPlugin,
  );
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
    const instance = api.plugins.getPlugin(TailwindPlugin).getInstance();
    instance.emitStaticCss();
    return instance.outputCss;
  } finally {
    tailwind.options = originalOptions;
  }
}
