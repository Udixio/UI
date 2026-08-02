import { useState } from 'react';
import { Button, Snackbar } from '@udixio/ui-react';

export default function SnackbarAutoDismissReact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-4">
      <Button label="Save" onClick={() => setOpen(true)} />
      <Snackbar
        message="Saved"
        duration={3000}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
