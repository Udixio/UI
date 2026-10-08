import type { API, ConfigInterface } from '@udixio/theme';
import type { Snippet } from 'svelte';

/**
 * Props for the dynamic theme provider.
 *
 * @status beta
 * @devx Wrap application content once to generate and inject the dynamic theme stylesheet.
 * @limitations Falls back to main-thread CSS generation if Web Workers are unavailable.
 */
export interface SvelteThemeProviderProps {
  /** The configuration returned by `defineConfig`. */
  config: Readonly<ConfigInterface>;
  /** Minimum delay between stylesheet rebuilds. @default 100 */
  throttleDelay?: number;
  /** Called after each successful stylesheet generation. */
  onLoad?: (api: API) => void;
  /** Run the theme plugins during initial loading. @default false */
  loadTheme?: boolean;
  /** Server-generated CSS rendered before the client runtime starts. */
  initialCss?: string;
  /** Content rendered inside the provider. */
  children?: Snippet;
}
