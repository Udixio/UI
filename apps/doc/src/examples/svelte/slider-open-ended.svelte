<script lang="ts">
  import { Slider } from '@udixio/ui-svelte';

  const marks = [
    { value: -Infinity, label: 'Min' },
    { value: 0, label: '0' },
    { value: 100, label: '100' },
    { value: Infinity, label: 'Max' },
  ];
</script>

<div class="w-72">
  <Slider
    name="range"
    defaultValue={0}
    min={-Infinity}
    max={Infinity}
    {marks}
    aria-label="Open-ended range"
  />
</div>
