import { installDynamicThemeWorker } from '@udixio/tailwind';
import type { DynamicThemeWorkerScope } from '@udixio/tailwind';

export type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from './theme.worker.processor';

installDynamicThemeWorker(self as unknown as DynamicThemeWorkerScope);
