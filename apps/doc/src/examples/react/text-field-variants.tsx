import { TextField } from '@udixio/ui-react';

export default function TextFieldVariantsReact() {
  return (
    <div className="flex flex-wrap items-end gap-6">
      <TextField label="Name" name="name" variant="filled" />
      <TextField label="Name" name="name2" variant="outlined" />
    </div>
  );
}
