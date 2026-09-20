<script lang="ts">
  import type { DatePickerValue } from '@udixio/core';
  import { DatePicker } from '@udixio/ui-svelte';

  let date = $state<DatePickerValue>(new Date());
  const formatDate = (value: DatePickerValue) =>
    value instanceof Date ? value.toLocaleDateString() : '-';
</script>

<div class="flex flex-col items-center gap-4">
  <DatePicker bind:value={date} />
  <p class="text-body-medium">Selected: {formatDate(date)}</p>
</div>
