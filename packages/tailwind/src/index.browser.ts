import { main } from './main';
import { createGenerateThemeCss } from './generate-theme-css';
import { TailwindPlugin } from './browser/tailwind.plugin';

export * from './plugins-tailwind';
export * from './browser/tailwind.plugin';
export * from './browser/define-config';
export * from './generate-static-theme-css';
export * from './dynamic-theme-runtime';
export * from './dynamic-theme-worker.processor';
export { createDynamicThemeWorker } from './create-dynamic-theme-worker.browser';
export { defineConfig, type ConfigInterface } from './browser/define-config.js';

/** Generates browser-compatible theme CSS for server rendering or hydration. */
export const generateThemeCss = createGenerateThemeCss({
  prepare: (config) => {
    config.plugins?.forEach((plugin) => {
      if (plugin instanceof TailwindPlugin) {
        plugin.options = { ...plugin.options, ssr: true };
      }
    });
  },
  getCss: (api) =>
    api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss,
});

export default main;
