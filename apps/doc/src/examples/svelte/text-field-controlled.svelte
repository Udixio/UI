<script lang="ts">
  import { TextField } from '@udixio/ui-svelte';

  let value = $state('hello');
</script>

<div class="flex flex-col gap-3">
  <TextField label="Controlled" name="c1" bind:value />
  <TextField label="Uncontrolled" name="u2" defaultValue="Initial value" />
  <p class="text-body-medium">Value: {value}</p>
</div>
