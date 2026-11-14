<script lang="ts">
  import Slider from '../../src/lib/slider/Slider.svelte';
  const testState = window as unknown as { changes: number[]; removeEnabled: () => void };
  let visible = $state(true);
  testState.removeEnabled = () => { visible = false; };
  const record = (value: number) => testState.changes.push(value);
</script>
{#if visible}<Slider aria-label="Enabled" defaultValue={20} onChange={record} />{/if}
<Slider aria-label="Other" defaultValue={40} />
<Slider aria-label="Disabled" defaultValue={50} disabled onChange={record} />
