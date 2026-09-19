<script lang="ts">
  import { Slider } from '@udixio/ui-svelte';

  const marks = [
    { value: 0, label: '0' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
    { value: 75, label: '75' },
    { value: 100, label: '100' },
  ];
</script>

<div class="w-72">
  <Slider name="percent" defaultValue={50} {marks} aria-label="Percent" />
</div>
