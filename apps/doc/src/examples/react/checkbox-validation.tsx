import { useState, type FormEvent } from 'react';
import { Button, Checkbox } from '@udixio/ui-react';

export default function CheckboxValidationReact() {
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const invalid = submitted && !accepted;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <form
      className="flex flex-col items-start gap-3"
      noValidate
      onSubmit={submit}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          id="checkbox-react-terms"
          name="terms"
          value="accepted"
          checked={accepted}
          required
          invalid={invalid}
          aria-describedby="checkbox-react-terms-description"
          onCheckedChange={setAccepted}
        />
        <label htmlFor="checkbox-react-terms">Accept the terms</label>
      </div>
      <p
        id="checkbox-react-terms-description"
        className={invalid ? 'text-error' : 'text-on-surface-variant'}
        aria-live="polite"
      >
        {invalid ? 'You must accept the terms.' : 'Required to continue.'}
      </p>
      <Button type="submit" label="Continue" />
    </form>
  );
}
