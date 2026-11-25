<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, TextField, motion } from '@udixio/ui-svelte';

  let code = $state('');
  let invalid = $state(false);
  let refusals = $state(0);

  // Only 1234 is accepted: each refusal is a new value of state, and the field shakes.
  function submit(event: SubmitEvent) {
    event.preventDefault();
    invalid = code !== '1234';
    if (invalid) refusals += 1;
  }
</script>

<form onsubmit={submit} class="flex flex-col items-start gap-4">
  <!-- The motion goes on the component itself: the shake moves the whole field, not only its input. -->
  <TextField
    label="PIN"
    bind:value={code}
    errorText={invalid ? 'Wrong PIN' : undefined}
    {@attach motion('shake', () => ({ state: refusals }))}
  />
  <Button type="submit" size="small" label="Check" />
</form>
