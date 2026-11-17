<script lang="ts">
  import type { DatePickerValue } from '@udixio/core';
  import { DatePicker } from '@udixio/ui-svelte';

  let date = $state<DatePickerValue>(new Date(2024, 5, 1));
  const formatDate = (value: DatePickerValue) =>
    value instanceof Date ? value.toLocaleDateString('en-US') : '-';
</script>

<div class="flex flex-col items-center gap-4">
  <DatePicker locale="en-US" bind:value={date} />
  <p class="text-body-medium">Selected: {formatDate(date)}</p>
</div>
