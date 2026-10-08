import DynamicThemeWorkerConstructor from './dynamic-theme.worker.ts?worker&inline';
import type { DynamicThemeWorker } from './dynamic-theme-runtime';

/** Creates the shared inlined worker used by every framework adapter. */
export function createDynamicThemeWorker(): DynamicThemeWorker {
  return new DynamicThemeWorkerConstructor() as unknown as DynamicThemeWorker;
}
