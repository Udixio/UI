import {
  ThemeWorkerProcessor,
  type WorkerInboundMessage,
  type WorkerOutboundMessage,
} from './theme.worker.processor';

export type { WorkerInboundMessage, WorkerOutboundMessage };

const processor = new ThemeWorkerProcessor();
let latestMessage: WorkerInboundMessage | null = null;
let processing = false;

async function processLatest() {
  if (processing || !latestMessage) return;
  processing = true;

  const msg = latestMessage;
  latestMessage = null;

  try {
    const css = await processor.process(msg);
    self.postMessage({ id: msg.id, css } satisfies WorkerOutboundMessage);
  } catch (e) {
    console.error('[Worker] error during processLatest:', e);
    self.postMessage({
      id: msg.id,
      error: e instanceof Error ? e.message : String(e),
    } satisfies WorkerOutboundMessage);
  } finally {
    processing = false;
    // Traite le prochain message s'il est arrivé pendant le traitement
    processLatest();
  }
}

self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  latestMessage = event.data;
  processLatest();
};
