import { main } from './main';
import { createGenerateThemeCss } from './generate-theme-css';
import { TailwindPlugin } from './node/tailwind.plugin';

export * from './plugins-tailwind';
// Spell out the directory index: `dist/node.js` is also a package entry file,
// and the ambiguous `./node` specifier can hide the subpath declarations from
// TypeScript consumers that resolve the Node build's types condition.
export * from './node/index';
export * from './dynamic-theme-runtime';
export {
  DynamicThemeWorkerProcessor,
  installDynamicThemeWorker,
  type WorkerInboundMessage,
  type WorkerOutboundMessage,
} from './dynamic-theme-worker.processor';
export {
  createDynamicThemeWorker,
  createDynamicThemeWorkerMessage,
} from './create-dynamic-theme-worker.node';
export { defineConfig, type ConfigInterface } from './node/define-config.js';

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
