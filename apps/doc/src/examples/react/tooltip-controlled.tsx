import { useState } from 'react';
import { Button, Tooltip } from '@udixio/ui-react';

export default function TooltipControlledReact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-6 p-8">
      <Tooltip text="Controlled tooltip" open={open} onOpenChange={setOpen}>
        <Button label={open ? 'Hide' : 'Show'} onClick={() => setOpen(!open)} />
      </Tooltip>
    </div>
  );
}
