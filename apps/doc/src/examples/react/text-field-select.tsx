import { TextField } from '@udixio/ui-react';

export default function TextFieldSelectReact() {
  return (
    <TextField
      label="Country"
      name="country"
      type="select"
      options={[
        { value: 'fr', label: 'France' },
        { value: 'de', label: 'Germany' },
        { value: 'jp', label: 'Japan' },
      ]}
    />
  );
}
