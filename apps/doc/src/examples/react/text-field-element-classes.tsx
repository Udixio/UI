import { TextField } from '@udixio/ui-react';

export default function TextFieldElementClassesReact() {
  return (
    <div className="flex flex-wrap items-end gap-6">
      <TextField label="Name" name="name" className="w-72" />
      <TextField
        label="Code"
        name="code"
        supportingText="Uppercase letters only"
        className={{
          input: 'uppercase tracking-widest',
          supportingText: 'italic',
        }}
      />
    </div>
  );
}
