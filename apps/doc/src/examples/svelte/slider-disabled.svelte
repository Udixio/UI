<script lang="ts">
  import { Slider } from '@udixio/ui-svelte';
</script>

<div class="w-72">
  <Slider
    name="volume"
    defaultValue={40}
    step={10}
    disabled
    aria-label="Volume (disabled)"
  />
</div>
