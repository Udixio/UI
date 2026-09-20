<script lang="ts">
  import { DatePicker } from '@udixio/ui-svelte';
</script>

<div class="flex flex-col items-center gap-8">
  <DatePicker minDate={new Date(2024, 0, 1)} maxDate={new Date(2024, 11, 31)} defaultValue={new Date(2024, 5, 1)} />
  <DatePicker
    shouldDisableDate={(date) => date.getDay() === 0 || date.getDay() === 6}
    defaultValue={new Date(2024, 5, 1)}
  />
</div>
