import { type API, type ConfigInterface, loader } from '@udixio/theme';

interface GenerateThemeCssAdapter {
  prepare(config: ConfigInterface): void;
  getCss(api: API): string;
}

/** Builds the framework-neutral CSS generation helper for a Tailwind adapter. */
export function createGenerateThemeCss(adapter: GenerateThemeCssAdapter) {
  return async function generateThemeCss(
    config: ConfigInterface,
    onApi?: (api: API) => void | Promise<void>,
  ): Promise<string> {
    adapter.prepare(config);
    const api = await loader(config, false);
    await onApi?.(api);
    await api.load();
    return adapter.getCss(api);
  };
}
