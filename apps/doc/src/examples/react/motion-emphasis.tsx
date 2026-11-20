import { type FormEvent, useState } from 'react';
import { Button, TextField, useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionEmphasisReact() {
  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);
  // An emphasis replays with play(): the shake when the code is refused, the press on each check.
  // Each motion sits on a plain wrapper, around the component it moves.
  const field = useMotion('shake');
  const check = useMotion('press');

  // Enter in the field submits the form, as Check does.
  const submit = (event: FormEvent) => {
    event.preventDefault();
    check.play();
    setInvalid(code !== '1234');
    if (code !== '1234') field.play();
  };

  return (
    <form onSubmit={submit} className="flex flex-col items-start gap-4">
      <div ref={field.ref}>
        <TextField
          label="Code"
          value={code}
          onChange={setCode}
          errorText={invalid ? 'Not this code' : undefined}
        />
      </div>
      <span ref={check.ref} className="inline-flex">
        <Button type="submit" size="small" label="Check" />
      </span>
    </form>
  );
}
