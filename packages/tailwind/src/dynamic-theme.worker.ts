import { installDynamicThemeWorker } from './dynamic-theme-worker.processor';
import type { DynamicThemeWorkerScope } from './dynamic-theme-runtime';

installDynamicThemeWorker(self as unknown as DynamicThemeWorkerScope);
