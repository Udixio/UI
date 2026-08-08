import { useState } from 'react';
import { TextField } from '@udixio/ui-react';

export default function TextFieldControlledReact() {
  const [value, setValue] = useState('hello');
  return (
    <div className="flex flex-col gap-3">
      <TextField
        label="Controlled"
        name="c1"
        value={value}
        onChange={setValue}
      />
      <TextField label="Uncontrolled" name="u2" defaultValue="Initial value" />
    </div>
  );
}
