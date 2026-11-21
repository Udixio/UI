import { useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { Button, Motion, Presence } from '@udixio/ui-react';

// 1. Define, once, in a module: the motion is registered under its name, for the whole page.
defineMotion('toast-in', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0 },
  ],
});

// A toast that enters when it is rendered, and leaves before it is removed.
export function SaveToLibrary() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col items-start gap-4">
      <Button
        label={saved ? 'Remove from library' : 'Save to library'}
        onClick={() => setSaved(!saved)}
      />
      <div role="status">
        <Presence>
          {/* 2. Attach: <Motion> binds the motion to the element it renders. */}
          {/* 3. Trigger: rendering it plays the entry; <Presence> keeps it until its exit has played. */}
          {saved && (
            <Motion key="saved" as="p" name="toast-in">
              Saved to your library
            </Motion>
          )}
        </Presence>
      </div>
    </div>
  );
}
