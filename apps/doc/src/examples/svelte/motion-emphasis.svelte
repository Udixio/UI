<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, TextField, motion } from '@udixio/ui-svelte';

  let code = $state('');
  let checks = $state(0);
  let refusals = $state(0);
  let invalid = $state(false);

  // Enter in the field submits the form, as Check does.
  function submit(event: SubmitEvent) {
    event.preventDefault();
    checks += 1;
    invalid = code !== '1234';
    if (invalid) refusals += 1;
  }
</script>

<form onsubmit={submit} class="flex flex-col items-start gap-4">
  <!-- The motion goes on the component itself: the shake moves the whole field, not only its input. -->
  <TextField
    label="Code"
    bind:value={code}
    errorText={invalid ? 'Not this code' : undefined}
    {@attach motion('shake', () => ({ state: refusals }))}
  />
  <Button type="submit" size="small" label="Check" {@attach motion('press', () => ({ state: checks }))} />
</form>
