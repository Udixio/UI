<!-- TRIAL (review 5, Q3): a Udixio component animated with no wrapper. Delete or keep with the decision. -->
<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, Card, ContextMenu, MenuItem, Snackbar, TextField, motion } from '@udixio/ui-svelte';

  let saves = $state(0);
  let linked = $state(false);
  let shown = $state(true);
  // Closed in the server HTML: the details must not show before the page hydrates.
  let open = $state(false);
  let code = $state('');
  let refusals = $state(0);
  let notified = $state(true);
  let pulses = $state(0);
  const invalid = $derived(refusals > 0 && code !== '1234');

  // Enter in the field submits the form, as Check does.
  function check(event: SubmitEvent) {
    event.preventDefault();
    if (code !== '1234') refusals += 1;
  }
</script>

<div class="grid gap-8" data-trial="svelte">
  <!-- The attachment goes through the Button's rest props to its <button>, then to its <a> once it is a link. -->
  <div class="flex flex-wrap items-center gap-4" data-trial-part="press">
    <Button
      size="small"
      href={linked ? '#trial-link' : undefined}
      label={saves === 0 ? 'Save' : `Saved ${saves}×`}
      onclick={() => (saves += 1)}
      {@attach motion('press', () => ({ state: saves }))}
    />
    <Button size="small" variant="text" label={linked ? 'Make it a button' : 'Make it a link'} onclick={() => (linked = !linked)} />
  </div>
  <!-- The entry and the exit play on the Card's root: a transition cannot sit on a component, so the Card stays, hidden. -->
  <div class="flex flex-col items-start gap-4" data-trial-part="appear">
    <Button size="small" variant="tonal" label={shown ? 'Hide the card' : 'Show the card'} onclick={() => (shown = !shown)} />
    <Card variant="elevated" class="w-full max-w-xs p-4" hidden={!shown} {@attach motion('slide', () => ({ present: shown }))}>
      <p class="text-title-medium text-on-surface">Weekly report</p>
      <p class="mt-1 text-body-medium text-on-surface-variant">Ready to share.</p>
    </Card>
  </div>
  <!-- Closed from the server HTML on: the Card's root is hidden, and it is the one that moves. -->
  <div class="flex flex-col items-start gap-4" data-trial-part="closed">
    <Button size="small" variant="tonal" label={open ? 'Close the details' : 'Open the details'} onclick={() => (open = !open)} />
    <Card variant="filled" class="w-full max-w-xs p-4" hidden={!open} {@attach motion('slide', () => ({ present: open }))}>
      <p class="text-title-medium text-on-surface" data-trial-details>Delivery details</p>
      <p class="mt-1 text-body-medium text-on-surface-variant">Ships in two days.</p>
    </Card>
  </div>
  <!-- The shake moves the field's root, not its input. -->
  <form onsubmit={check} class="flex flex-col items-start gap-4" data-trial-part="shake">
    <TextField
      label="Code"
      bind:value={code}
      errorText={invalid ? 'Not this code' : undefined}
      {@attach motion('shake', () => ({ state: refusals }))}
    />
    <Button type="submit" size="small" variant="outlined" label="Check" />
  </form>
  <!-- Step B: the Snackbar holds its presence, so "fade" is ignored (development names Snackbar); the "press" plays. -->
  <div class="flex flex-col items-start gap-4" data-trial-part="refused">
    <div class="flex flex-wrap gap-2">
      <Button size="small" variant="tonal" label={notified ? 'Dismiss' : 'Notify'} onclick={() => (notified = !notified)} />
      <Button size="small" variant="text" label="Pulse" onclick={() => (pulses += 1)} />
    </div>
    <Snackbar bind:open={notified} message="Draft saved" {@attach motion('fade press', () => ({ state: pulses }))} />
    <p class="text-body-small text-on-surface-variant">
      Development: <code>"fade" ignored: Snackbar already holds a presence on this element</code>.
    </p>
    <!-- Step E: the menu is in the top layer and the trigger is the author's: the root has no box to give. -->
    <ContextMenu accessibleLabel="Draft actions" {@attach motion('press')}>
      {#snippet trigger()}<Button size="small" variant="outlined" label="Right-click me" />{/snippet}
      <MenuItem label="Rename" />
    </ContextMenu>
    <p class="text-body-small text-on-surface-variant">
      Development: <code>"press" ignored: … has no box to give (data-motion-box="none")</code>.
    </p>
  </div>
</div>
