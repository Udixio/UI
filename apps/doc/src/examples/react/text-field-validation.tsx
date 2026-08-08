import { TextField } from '@udixio/ui-react';

export default function TextFieldValidationReact() {
  return (
    <div className="flex flex-col gap-2">
      <TextField
        label="Username"
        name="u1"
        supportingText="Use 3–16 characters"
      />
      <TextField
        label="Password"
        name="p1"
        type="password"
        errorText="Password is too short"
      />
    </div>
  );
}
