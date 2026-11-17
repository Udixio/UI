<script lang="ts">
  import type { DateRange } from '@udixio/core';
  import { DatePicker } from '@udixio/ui-svelte';

  let range = $state<DateRange | null>([
    new Date(2024, 5, 10),
    new Date(2024, 5, 20),
  ]);
  const formatDate = (value: Date | null) =>
    value?.toLocaleDateString('en-US') ?? '-';
</script>

<div class="flex flex-col items-center gap-4">
  <DatePicker locale="en-US" mode="range" bind:value={range} />
  <p class="text-body-medium text-center">
    Start: {formatDate(range?.[0] ?? null)}<br />
    End: {formatDate(range?.[1] ?? null)}
  </p>
</div>
