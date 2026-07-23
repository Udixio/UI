import type { FabMenuDismissReason } from '../behaviors/fab-menu.behavior.js';

export interface FabMenuControllerOptions {
  root: HTMLElement;
  trigger: HTMLElement;
  panel: HTMLElement;
  onDismiss: (reason: FabMenuDismissReason) => void;
}

export interface FabMenuController {
  destroy(): void;
}

/** Connects focus and dismissal behavior shared by every FabMenu adapter. */
export function createFabMenuController({
  root,
  trigger,
  panel,
  onDismiss,
}: FabMenuControllerOptions): FabMenuController {
  const ownerDocument = root.ownerDocument;
  let destroyed = false;

  queueMicrotask(() => {
    if (destroyed) return;
    panel
      .querySelector<HTMLElement>(
        '[data-fab-menu-action]:not(:disabled):not([aria-disabled="true"]), button:not(:disabled), a[href]:not([aria-disabled="true"])',
      )
      ?.focus();
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    onDismiss('escape');
    queueMicrotask(() => trigger.focus());
  };
  const handlePointerDown = (event: Event) => {
    if (root.contains(event.target as Node)) return;
    onDismiss('outside');
  };

  ownerDocument.addEventListener('keydown', handleKeyDown);
  ownerDocument.addEventListener('pointerdown', handlePointerDown, true);

  return {
    destroy() {
      destroyed = true;
      ownerDocument.removeEventListener('keydown', handleKeyDown);
      ownerDocument.removeEventListener('pointerdown', handlePointerDown, true);
    },
  };
}
