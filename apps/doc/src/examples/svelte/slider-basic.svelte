<script lang="ts">
  import { Slider } from '@udixio/ui-svelte';

  let value = $state(30);
</script>

<div class="flex w-72 flex-col gap-4">
  <Slider
    name="volume"
    defaultValue={30}
    step={10}
    onChange={(next) => (value = next)}
    aria-label="Volume"
  />
  <p class="text-body-medium">Value: {value}</p>
</div>
