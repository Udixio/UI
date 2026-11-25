import { type FormEvent, useState } from 'react';
import { Button, Motion, TextField } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionEmphasisShakeReact() {
  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [refusals, setRefusals] = useState(0);

  // Only 1234 is accepted: each refusal is a new value of state, and the field shakes.
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const refused = code !== '1234';
    setInvalid(refused);
    if (refused) setRefusals((count) => count + 1);
  };

  return (
    <form onSubmit={submit} className="flex flex-col items-start gap-4">
      {/* The motion goes on the component itself: the shake moves the whole field, not only its input. */}
      <Motion
        as={TextField}
        name="shake"
        state={refusals}
        label="PIN"
        value={code}
        onChange={setCode}
        errorText={invalid ? 'Wrong PIN' : undefined}
      />
      <Button type="submit" size="small" label="Check" />
    </form>
  );
}
