import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionRecipeDialogReact() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const textId = useId();

  // On open, focus goes to the safe choice of the dialog.
  useEffect(() => {
    if (open) cancel.current?.focus();
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setOpen(false);
  };

  return (
    // In a page, the layer is `fixed` and `inert` goes on the rest of the page.
    <div className="relative w-full max-w-96">
      <div inert={open} className="flex min-h-64 flex-col items-start gap-3 rounded-3xl bg-surface-container p-5">
        <p className="text-label-large text-on-surface-variant">Drafts</p>
        <h3 className="text-title-medium text-on-surface">Spring launch notes</h3>
        <p className="text-body-medium text-on-surface-variant">Edited two hours ago</p>
        <Button ref={opener} size="small" variant="tonal" label="Delete draft" onClick={() => setOpen(true)} />
      </div>
      {/* Both stay rendered until their exit has played. */}
      <Presence>
        {open && (
          <Motion key="scrim" name="fade" className="absolute inset-0 rounded-3xl bg-black/32" onClick={() => setOpen(false)} />
        )}
        {open && (
          <Motion
            key="dialog"
            name="scale"
            // The exit starts with focus inside: it goes back to the button that opened the dialog.
            restoreFocus={() => opener.current}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={textId}
            onKeyDown={onKeyDown}
            className="absolute inset-0 m-auto flex h-fit w-[calc(100%-1rem)] max-w-72 flex-col gap-4 rounded-3xl bg-surface-container-high p-6"
          >
            <h2 id={titleId} className="text-title-large text-on-surface">Delete this draft?</h2>
            <p id={textId} className="text-body-medium text-on-surface-variant">
              Spring launch notes will be removed from your drafts.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button ref={cancel} size="small" variant="text" label="Cancel" onClick={() => setOpen(false)} />
              <Button size="small" variant="text" label="Delete" onClick={() => setOpen(false)} />
            </div>
          </Motion>
        )}
      </Presence>
    </div>
  );
}
