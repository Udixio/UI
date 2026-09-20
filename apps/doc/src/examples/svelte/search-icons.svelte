<script lang="ts">
  import { iFilter } from '@udixio/icons-rounded-400/filter';
  import { iHistory } from '@udixio/icons-rounded-400/history';
  import { iSettings } from '@udixio/icons-rounded-400/settings';
  import { iTune } from '@udixio/icons-rounded-400/tune';
  import { IconButton, Search } from '@udixio/ui-svelte';

  const history = ['Material search', 'Search accessibility', 'Search patterns'];
  let query = $state('');
  let expanded = $state(false);
  let filtersOpen = $state(false);
  let settingsOpen = $state(false);
</script>

{#snippet filterActions()}
  <IconButton icon={iTune} label="Open filters" tooltip={false} toggleable bind:pressed={filtersOpen} />
{/snippet}

{#snippet historyActions()}
  <IconButton icon={iSettings} label="Open search settings" tooltip={false} toggleable bind:pressed={settingsOpen} />
  <IconButton icon={iTune} label="Open search filters" tooltip={false} onclick={() => (filtersOpen = true)} />
{/snippet}

<div class="flex w-full flex-col gap-4">
  <Search label="Filter results" defaultQuery="Material" leadingIcon={iFilter} clearLabel="Remove filter" trailingActions={filterActions} />
  <Search
    label="Search history"
    bind:query
    bind:expanded
    leadingIcon={iHistory}
    clearable={false}
    clearLabel="Clear history query"
    resultsLabel="Search history suggestions"
    trailingActions={historyActions}
  >
    {#each history as result (result)}
      <div role="option" aria-selected={false} tabindex={-1} class="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]">{result}</div>
    {/each}
  </Search>
</div>
