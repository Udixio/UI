import { TextField } from '@udixio/ui-react';

export default function TextFieldMultilineReact() {
  return (
    <div className="flex flex-col gap-4">
      <TextField label="Description" name="desc1" multiline />
      <TextField
        label="Notes"
        name="desc2"
        multiline
        defaultValue="Initial content"
      />
    </div>
  );
}
