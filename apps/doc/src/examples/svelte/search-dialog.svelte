<script lang="ts">
  import { Button, Search } from '@udixio/ui-svelte';

  let selectedAction = $state('No action selected');
</script>

<div class="flex w-full flex-col items-center gap-3">
  <Search label="Search commands" defaultQuery="settings" defaultExpanded resultsRole="dialog" resultsLabel="Command details" clearLabel="Clear command query">
    <div class="flex flex-col gap-3 p-4">
      <h3 class="text-title-medium">Settings</h3>
      <p class="text-body-medium text-on-surface-variant">This is a rich projected result, not a listbox option. The consumer owns its internal focus and actions.</p>
      <Button
        size="small"
        class="self-start"
        label="Open settings"
        onclick={() => (selectedAction = 'Settings opened')}
      />
    </div>
  </Search>
  <p class="text-body-small text-on-surface-variant" role="status">{selectedAction}</p>
</div>
