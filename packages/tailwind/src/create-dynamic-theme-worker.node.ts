import type {
  DynamicThemeWorker,
  DynamicThemeWorkerInboundMessage,
} from './dynamic-theme-runtime';
import { FontPlugin, serializeThemeContext, type API } from '@udixio/theme';
import { TailwindPlugin } from './node/tailwind.plugin';

/** Serializes the current node API into the shared browser worker protocol. */
export function createDynamicThemeWorkerMessage(
  id: number,
  api: API,
): DynamicThemeWorkerInboundMessage {
  return {
    id,
    snapshot: serializeThemeContext(api),
    tailwindOptions: api.plugins.getPlugin(TailwindPlugin).toSerializable(),
    fontOptions: api.plugins.getPlugin(FontPlugin).toSerializable(),
  };
}

/** Server environments defer theme generation to their rendering pipeline. */
export function createDynamicThemeWorker(): DynamicThemeWorker | null {
  return null;
}
