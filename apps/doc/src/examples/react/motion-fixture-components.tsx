// Test fixture (tests/components-box.browser.test.mjs): Udixio components that take a motion with no wrapper box. Not a documentation example.
import { type FormEvent, useState } from 'react';
import { Button, Card, Motion, Presence, Snackbar, TextField, Tooltip } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionFixtureComponentsReact() {
  const [saves, setSaves] = useState(0);
  const [linked, setLinked] = useState(false);
  const [shown, setShown] = useState(true);
  // Closed in the server HTML: the details must not show before the page hydrates.
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [refusals, setRefusals] = useState(0);
  const [notified, setNotified] = useState(true);
  const [pulses, setPulses] = useState(0);
  const invalid = refusals > 0 && code !== '1234';

  // Enter in the field submits the form, as Check does.
  const check = (event: FormEvent) => {
    event.preventDefault();
    if (code !== '1234') setRefusals((value) => value + 1);
  };

  return (
    <div className="grid gap-8" data-fixture="react">
      {/* <Motion as={Button}>: the press moves the Button's own <button>, then its <a> once it is a link. */}
      <div className="flex flex-wrap items-center gap-4" data-fixture-part="press">
        <Motion
          as={Button}
          name="press"
          state={saves}
          size="small"
          href={linked ? '#fixture-link' : undefined}
          label={saves === 0 ? 'Save' : `Saved ${saves}×`}
          onClick={() => setSaves((value) => value + 1)}
        />
        <Button size="small" variant="text" label={linked ? 'Make it a button' : 'Make it a link'} onClick={() => setLinked((value) => !value)} />
      </div>
      {/* <Motion as={Card}>: the entry and the exit play on the Card's root. */}
      <div className="flex flex-col items-start gap-4" data-fixture-part="appear">
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
      <div className="flex flex-col items-start gap-4" data-fixture-part="closed">
        <Button size="small" variant="tonal" label={open ? 'Close the details' : 'Open the details'} onClick={() => setOpen((value) => !value)} />
        <Motion as={Card} name="slide" present={open} variant="filled" className="w-full max-w-xs p-4">
          <p className="text-title-medium text-on-surface" data-fixture-details="">Delivery details</p>
          <p className="mt-1 text-body-medium text-on-surface-variant">Ships in two days.</p>
        </Motion>
      </div>
      {/* <Motion as={TextField}>: the shake moves the field's root, not its input. */}
      <form onSubmit={check} className="flex flex-col items-start gap-4" data-fixture-part="shake">
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
      {/* Step B: the Snackbar holds its presence, so "fade" is ignored (development names Snackbar); the "press" plays. */}
      <div className="flex flex-col items-start gap-4" data-fixture-part="refused">
        <div className="flex flex-wrap gap-2">
          <Button size="small" variant="tonal" label={notified ? 'Dismiss' : 'Notify'} onClick={() => setNotified((value) => !value)} />
          <Button size="small" variant="text" label="Pulse" onClick={() => setPulses((value) => value + 1)} />
        </div>
        <Motion as={Snackbar} name="fade press" state={pulses} open={notified} onOpenChange={setNotified} message="Draft saved" />
        <p className="text-body-small text-on-surface-variant">
          Development: <code>"fade" ignored: Snackbar already holds a presence on this element</code>.
        </p>
        {/* Step E: the Tooltip's surface is in a portal: it has no box to give, so nothing binds, not even on its anchor. */}
        <Motion as={Tooltip} name="press" text="Copied to the clipboard">
          <Button size="small" variant="outlined" label="Copy" />
        </Motion>
        <p className="text-body-small text-on-surface-variant">
          Development: <code>"press" ignored: … has no box to give (data-motion-box="none")</code>.
        </p>
      </div>
    </div>
  );
}
