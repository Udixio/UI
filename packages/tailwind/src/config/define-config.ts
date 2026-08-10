import {
  ConfigInterface as ThemeConfig,
  defineConfig as defineThemeConfig,
  FontPlugin,
  FontPluginOptions,
  PluginAbstract,
  Variants,
} from '@udixio/theme';
import type { TailwindPluginOptions } from '../browser/tailwind.plugin';

/**
 * The flat configuration accepted by `defineConfig`: the theme's own options,
 * plus `TailwindPlugin`'s and `FontPlugin`'s, merged at the top level so callers
 * never instantiate a plugin themselves.
 *
 * `plugins` is omitted because `defineConfig` owns it, and `isDark` because the
 * static stylesheet emits both schemes — pick between them with `darkMode`.
 */
export type ConfigInterface = Omit<ThemeConfig, 'plugins' | 'isDark'> &
  TailwindPluginOptions &
  FontPluginOptions;

type TailwindPluginConstructor = new (
  options: TailwindPluginOptions,
) => PluginAbstract<any, TailwindPluginOptions>;

/**
 * Builds a `defineConfig` bound to one `TailwindPlugin` implementation.
 *
 * The node and browser builds ship different implementations — only the node
 * one writes `outFile` to disk — so each entry point binds its own rather than
 * importing across the boundary.
 */
export function createDefineConfig(TailwindPlugin: TailwindPluginConstructor) {
  return function defineConfig(config: ConfigInterface): ThemeConfig {
    return defineThemeConfig({
      variant: Variants.Udixio,
      ...config,
      plugins: [new FontPlugin(config), new TailwindPlugin(config)],
    });
  };
}
