import type { ConfigInterface } from '@udixio/theme';
import type { Plugin } from 'vite';
import { main as tailwind } from '../main';
import {
  findTailwindPlugin,
  generateStaticThemeCss,
} from '../generate-static-theme-css';

/**
 * The virtual module serving the static theme CSS:
 * `import 'virtual:udixio/theme.css'`. It is what `udixio-theme build` writes
 * to `udixio.generated.css`, generated in memory instead.
 */
export const VIRTUAL_CSS_ID = 'virtual:udixio/theme.css';

export interface UdixioViteOptions {
  /**
   * The theme config (the output of `defineConfig()`), imported from
   * `theme.config.ts` by the Vite config itself. Required by the browser
   * build; optional in Node, where the plugin loads `configPath` instead.
   */
  config?: ConfigInterface;
  /**
   * Node build only: path of the config to load, without extension.
   * @default './theme.config'
   */
  configPath?: string;
  verbose?: boolean;
}

/**
 * A Vite plugin that also carries the JavaScript modules behind the
 * generated CSS's `@plugin` directives, for Tailwind engines that cannot
 * resolve them from `node_modules` (a preview bundler running in the
 * browser, say).
 */
export interface UdixioVitePlugin extends Plugin {
  /** `@plugin "name"` → the Tailwind plugin (the default export of that package) */
  tailwind: Record<string, unknown>;
}

/** what `resolveId` claims for a given config: the virtual id, or `./<outFile basename>` */
function matchesGeneratedCss(id: string, outFile: string | undefined) {
  if (id === VIRTUAL_CSS_ID) return true;
  const basename = (outFile ?? 'udixio.generated.css').split('/').pop();
  const file = id.split('?')[0].split('/').pop();
  return file === basename;
}

/**
 * The part of `udixio()` common to the node and browser builds: the plugin
 * object, its `tailwind` modules, and the virtual CSS.
 *
 * `claimGeneratedFile`: whether an import of `./udixio.generated.css` (the
 * `outFile` basename) is answered by the virtual CSS as well. The browser
 * build does, having no file system to write the file to; the node build
 * leaves that import to the file it writes.
 */
export function createUdixioPlugin(
  getConfig: () => ConfigInterface | Promise<ConfigInterface>,
  { claimGeneratedFile }: { claimGeneratedFile: boolean },
): UdixioVitePlugin {
  const resolveOutFile = async () =>
    findTailwindPlugin(await getConfig())?.options.outFile;

  return {
    name: 'udixio',
    tailwind: { '@udixio/tailwind': tailwind },

    async resolveId(id) {
      if (id === VIRTUAL_CSS_ID) return VIRTUAL_CSS_ID;
      if (claimGeneratedFile && matchesGeneratedCss(id, await resolveOutFile())) {
        return VIRTUAL_CSS_ID;
      }
      return null;
    },

    async load(id) {
      if (id !== VIRTUAL_CSS_ID) return null;
      return generateStaticThemeCss(await getConfig());
    },
  };
}
