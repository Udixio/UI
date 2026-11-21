import { useId, useState } from 'react';
import { Button, Motion, Presence } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function SavedAndDetails() {
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-wrap gap-2">
        <Button size="small" label="Save" onClick={() => setSaved(true)} />
        <Button
          size="small"
          variant="tonal"
          label={open ? 'Hide details' : 'Show details'}
          aria-expanded={open}
          aria-controls={`${id}-details`}
          onClick={() => setOpen((value) => !value)}
        />
      </div>
      {/* Transient: the toast is removed once its exit has played. */}
      <div aria-live="polite">
        <Presence>
          {saved && (
            <Motion key="saved" name="slide" className="flex items-center gap-2">
              Saved to your library
              <Button size="small" variant="text" label="Dismiss" onClick={() => setSaved(false)} />
            </Motion>
          )}
        </Presence>
      </div>
      {/* Content: the panel stays in the DOM, hidden while closed, so its text is in the server HTML. */}
      <Motion id={`${id}-details`} name="fade" present={open}>
        Recorded live in 1977, remastered in 2019.
      </Motion>
    </div>
  );
}
