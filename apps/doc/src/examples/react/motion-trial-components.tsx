// TRIAL (review 5, Q3): a Udixio component animated with no wrapper. Delete or keep with the decision.
import { type FormEvent, useState } from 'react';
import { Button, Card, Motion, TextField } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionTrialComponentsReact() {
  const [saves, setSaves] = useState(0);
  const [entries, setEntries] = useState(0);
  const [code, setCode] = useState('');
  const [refusals, setRefusals] = useState(0);
  const invalid = refusals > 0 && code !== '1234';

  // Enter in the field submits the form, as Check does.
  const check = (event: FormEvent) => {
    event.preventDefault();
    if (code !== '1234') setRefusals((value) => value + 1);
  };

  return (
    <div className="grid gap-8" data-trial="react">
      {/* <Motion as={Button}>: the press moves the Button's own <button>. */}
      <div className="flex flex-wrap items-center gap-4" data-trial-part="press">
        <Motion
          as={Button}
          name="press"
          state={saves}
          size="small"
          label={saves === 0 ? 'Save' : `Saved ${saves}×`}
          onClick={() => setSaves((value) => value + 1)}
        />
      </div>
      {/* <Motion as={Card}>: the entry plays on the Card's root, each time it mounts. */}
      <div className="flex flex-col items-start gap-4" data-trial-part="appear">
        <Button size="small" variant="tonal" label="Show the card again" onClick={() => setEntries((value) => value + 1)} />
        <Motion key={entries} as={Card} name="slide" variant="elevated" className="w-full max-w-xs p-4">
          <p className="text-title-medium text-on-surface">Weekly report</p>
          <p className="mt-1 text-body-medium text-on-surface-variant">Ready to share.</p>
        </Motion>
      </div>
      {/* <Motion as={TextField}>: the shake moves the field's root, not its input. */}
      <form onSubmit={check} className="flex flex-col items-start gap-4" data-trial-part="shake">
        <Motion
          as={TextField}
          name="shake"
          state={refusals}
          label="Code"
          value={code}
          onChange={setCode}
          errorText={invalid ? 'Not this code' : undefined}
        />
        <Button type="submit" size="small" variant="outlined" label="Check" />
      </form>
    </div>
  );
}
