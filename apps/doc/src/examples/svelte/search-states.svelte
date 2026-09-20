<script lang="ts">
  import { Search } from '@udixio/ui-svelte';

  let focusState = $state('Focus the read-only field');
</script>

<div class="flex w-full flex-col gap-4">
  <div class="grid w-full gap-4 md:grid-cols-3">
    <Search label="Unavailable search" defaultQuery="Unavailable" disabled />
    <Search
      label="Read-only search"
      query="Locked query"
      readOnly
      clearable={false}
      onFocus={() => (focusState = 'Read-only field focused')}
      onBlur={() => (focusState = 'Read-only field blurred')}
    />
    <Search label="Search without clear action" defaultQuery="Persistent filter" clearable={false} />
  </div>
  <p class="text-body-small text-on-surface-variant" role="status">{focusState}</p>
</div>
