// TRIAL (review 5, Q3): a Udixio component animated with no wrapper. Delete or keep with the decision.
import { type FormEvent, useState } from 'react';
import { Button, Card, Motion, Presence, TextField } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionTrialComponentsReact() {
  const [saves, setSaves] = useState(0);
  const [linked, setLinked] = useState(false);
  const [shown, setShown] = useState(true);
  // Closed in the server HTML: the details must not show before the page hydrates.
  const [open, setOpen] = useState(false);
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
      {/* <Motion as={Button}>: the press moves the Button's own <button>, then its <a> once it is a link. */}
      <div className="flex flex-wrap items-center gap-4" data-trial-part="press">
        <Motion
          as={Button}
          name="press"
          state={saves}
          size="small"
          href={linked ? '#trial-link' : undefined}
          label={saves === 0 ? 'Save' : `Saved ${saves}×`}
          onClick={() => setSaves((value) => value + 1)}
        />
        <Button size="small" variant="text" label={linked ? 'Make it a button' : 'Make it a link'} onClick={() => setLinked((value) => !value)} />
      </div>
      {/* <Motion as={Card}>: the entry and the exit play on the Card's root. */}
      <div className="flex flex-col items-start gap-4" data-trial-part="appear">
        <Button size="small" variant="tonal" label={shown ? 'Hide the card' : 'Show the card'} onClick={() => setShown((value) => !value)} />
        <Presence>
          {shown && (
            <Motion key="report" as={Card} name="slide" variant="elevated" className="w-full max-w-xs p-4">
              <p className="text-title-medium text-on-surface">Weekly report</p>
              <p className="mt-1 text-body-medium text-on-surface-variant">Ready to share.</p>
            </Motion>
          )}
        </Presence>
      </div>
      {/* <Motion as={Card} present>: closed from the server HTML on, the wrapper is hidden; the Card's root moves. */}
      <div className="flex flex-col items-start gap-4" data-trial-part="closed">
        <Button size="small" variant="tonal" label={open ? 'Close the details' : 'Open the details'} onClick={() => setOpen((value) => !value)} />
        <Motion as={Card} name="slide" present={open} variant="filled" className="w-full max-w-xs p-4">
          <p className="text-title-medium text-on-surface" data-trial-details="">Delivery details</p>
          <p className="mt-1 text-body-medium text-on-surface-variant">Ships in two days.</p>
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
