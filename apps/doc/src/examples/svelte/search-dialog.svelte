<script lang="ts">
  import { Search } from '@udixio/ui-svelte';

  let selectedAction = $state('No action selected');
</script>

<div class="flex w-full flex-col items-center gap-3">
  <Search label="Search commands" defaultQuery="settings" defaultExpanded resultsRole="dialog" resultsLabel="Command details" clearLabel="Clear command query">
    <div class="flex flex-col gap-3 p-4">
      <h3 class="text-title-medium">Settings</h3>
      <p class="text-body-medium text-on-surface-variant">This is a rich projected result, not a listbox option. The consumer owns its internal focus and actions.</p>
      <button type="button" class="self-start rounded-full bg-primary px-4 py-2 text-label-large text-on-primary" onclick={() => (selectedAction = 'Settings opened')}>Open settings</button>
    </div>
  </Search>
  <p class="text-body-small text-on-surface-variant" role="status">{selectedAction}</p>
</div>
