import { useState } from 'react';
import { Button, Snackbar } from '@udixio/ui-react';

export default function SnackbarBasicReact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-4">
      <Button label="Send message" onClick={() => setOpen(true)} />
      <Snackbar
        message="Message sent"
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
