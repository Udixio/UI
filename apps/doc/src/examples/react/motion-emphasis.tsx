import { type FormEvent, useState } from 'react';
import { Button, Motion, TextField } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionEmphasisReact() {
  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);
  // Each new value of a count replays its emphasis: the press on each check, the shake on each refusal.
  const [checks, setChecks] = useState(0);
  const [refusals, setRefusals] = useState(0);

  // Enter in the field submits the form, as Check does.
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setChecks((value) => value + 1);
    setInvalid(code !== '1234');
    if (code !== '1234') setRefusals((value) => value + 1);
  };

  return (
    <form onSubmit={submit} className="flex flex-col items-start gap-4">
      {/* The motion goes on the component itself: the shake moves the whole field, not only its input. */}
      <Motion
        as={TextField}
        name="shake"
        state={refusals}
        label="Code"
        value={code}
        onChange={setCode}
        errorText={invalid ? 'Not this code' : undefined}
      />
      <Motion as={Button} name="press" state={checks} type="submit" size="small" label="Check" />
    </form>
  );
}
