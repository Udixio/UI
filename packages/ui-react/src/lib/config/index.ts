// `defineConfig` and its flat `ConfigInterface` live in `@udixio/tailwind`, the
// lowest package that can see both `TailwindPlugin` and `FontPlugin`. Nothing
// about them is React-specific; they are re-exported here so existing
// `theme.config.ts` files importing from `@udixio/ui-react` keep working.
export { defineConfig, type ConfigInterface } from '@udixio/tailwind';
