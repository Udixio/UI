import { main } from './main';

export * from './plugins-tailwind';
export * from './browser/tailwind.plugin';
export * from './browser/define-config';
export { defineConfig, type ConfigInterface } from './browser/define-config.js';
export default main;
