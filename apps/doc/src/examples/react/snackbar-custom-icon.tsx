import { useState } from 'react';
import { iCheck } from '@udixio/icons-rounded-400/check';
import { Button, Snackbar } from '@udixio/ui-react';

export default function SnackbarCustomIconReact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-4">
      <Button label="Show" onClick={() => setOpen(true)} />
      <Snackbar
        message="Done"
        closeIcon={iCheck}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
