import { useState } from 'react';
import { defineMotion } from '@udixio/motion';
import { Button, Motion, Presence } from '@udixio/ui-react';

defineMotion('pop', {
  verb: 'appear',
  keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }],
});

export function Saved() {
  const [open, setOpen] = useState(true);
  return <>
    <Button label="Toggle" onClick={() => setOpen(!open)} />
    <Presence>{open && <Motion as="p" key="note" name="pop">Saved to your library</Motion>}</Presence>
  </>;
}
