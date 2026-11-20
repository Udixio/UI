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
  <!-- Each motion sits on a plain wrapper, around the component it moves. -->
  <div {@attach motion('shake', () => ({ state: refusals }))}>
    <TextField
      label="Code"
      bind:value={code}
      errorText={invalid ? 'Not this code' : undefined}
    />
  </div>
  <span class="inline-flex" {@attach motion('press', () => ({ state: checks }))}>
    <Button type="submit" size="small" label="Check" />
  </span>
</form>
