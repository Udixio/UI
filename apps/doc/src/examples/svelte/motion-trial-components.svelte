<!-- TRIAL (review 5, Q3): a Udixio component animated with no wrapper. Delete or keep with the decision. -->
<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, Card, TextField, motion } from '@udixio/ui-svelte';

  let saves = $state(0);
  let entries = $state(0);
  let code = $state('');
  let refusals = $state(0);
  const invalid = $derived(refusals > 0 && code !== '1234');

  // Enter in the field submits the form, as Check does.
  function check(event: SubmitEvent) {
    event.preventDefault();
    if (code !== '1234') refusals += 1;
  }
</script>

<div class="grid gap-8" data-trial="svelte">
  <!-- The attachment goes through the Button's rest props to its <button>. -->
  <div class="flex flex-wrap items-center gap-4" data-trial-part="press">
    <Button
      size="small"
      label={saves === 0 ? 'Save' : `Saved ${saves}×`}
      onclick={() => (saves += 1)}
      {@attach motion('press', () => ({ state: saves }))}
    />
  </div>
  <!-- The entry plays on the Card's root, each time it mounts. -->
  <div class="flex flex-col items-start gap-4" data-trial-part="appear">
    <Button size="small" variant="tonal" label="Show the card again" onclick={() => (entries += 1)} />
    {#key entries}
      <Card variant="elevated" class="w-full max-w-xs p-4" {@attach motion('slide')}>
        <p class="text-title-medium text-on-surface">Weekly report</p>
        <p class="mt-1 text-body-medium text-on-surface-variant">Ready to share.</p>
      </Card>
    {/key}
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
</div>
