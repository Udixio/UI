<script lang="ts">
  import { Slider } from '@udixio/ui-svelte';

  let value = $state(50);
</script>

<div class="flex w-72 flex-col gap-4">
  <Slider
    name="brightness"
    bind:value
    step={10}
    aria-label="Brightness"
  />
  <p class="text-body-medium">Value: {value}</p>
</div>
