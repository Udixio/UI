import { useState } from 'react';
import { Button, SideSheet } from '@udixio/ui-react';

export default function SideSheetModalReact() {
  const [open, setOpen] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setContainer}
      className="relative min-h-80 w-full overflow-hidden rounded-xl [contain:layout]"
    >
      <div className="grid h-full content-between gap-8 p-4">
        <div
          className="rounded-xl border border-outline p-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-title-medium">
            Side sheet: {open ? 'open' : 'closed'}
          </p>
        </div>

        <div className="flex justify-end">
          <Button label="Open details" onClick={() => setOpen(true)} />
        </div>
      </div>

      <SideSheet
        variant="modal"
        title="Details"
        open={open}
        onOpenChange={setOpen}
        container={container}
      >
        <p className="p-4 text-body-medium text-on-surface-variant">
          Modal content. Press Escape, click the backdrop, or use the close
          button to dismiss it.
        </p>
      </SideSheet>
    </div>
  );
}
