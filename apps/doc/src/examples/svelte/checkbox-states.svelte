<script lang="ts">
  import { Checkbox } from '@udixio/ui-svelte';

  let checked = $state(false);
</script>

<div class="grid gap-3 sm:grid-cols-2">
  <div class="flex items-center gap-3">
    <Checkbox id="checkbox-svelte-controlled" bind:checked />
    <label for="checkbox-svelte-controlled">Controlled</label>
  </div>
  <div class="flex items-center gap-3">
    <Checkbox id="checkbox-svelte-default" defaultChecked />
    <label for="checkbox-svelte-default">Default checked</label>
  </div>
  <div class="flex items-center gap-3">
    <Checkbox id="checkbox-svelte-disabled" disabled />
    <label for="checkbox-svelte-disabled">Disabled</label>
  </div>
  <div class="flex items-center gap-3">
    <Checkbox id="checkbox-svelte-disabled-checked" defaultChecked disabled />
    <label for="checkbox-svelte-disabled-checked">Disabled and checked</label>
  </div>
</div>
