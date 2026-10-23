import { installDynamicThemeWorker } from './dynamic-theme-worker.processor';
import type { DynamicThemeWorkerScope } from './dynamic-theme-runtime';

if (typeof self !== 'undefined') {
  installDynamicThemeWorker(self as unknown as DynamicThemeWorkerScope);
}
