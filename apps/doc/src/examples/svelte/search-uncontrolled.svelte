<script lang="ts">
  import { Search } from '@udixio/ui-svelte';

  const recentSearches = ['Material 3', 'Search', 'Text field'];
  let lastQuery = $state('Material 3');
  let submittedQuery = $state('');
</script>

<div class="flex w-full flex-col items-center gap-3">
  <Search label="Recent searches" defaultQuery="Material 3" defaultExpanded onQueryChange={(value) => (lastQuery = value)} onSearch={(value) => (submittedQuery = value)}>
    {#each recentSearches as result (result)}
      <div role="option" aria-selected={false} tabindex={-1} class="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]">{result}</div>
    {/each}
  </Search>
  <p class="text-body-small text-on-surface-variant" role="status">
    Current query: {lastQuery || 'empty'} · Submitted: {submittedQuery || 'not yet'}
  </p>
</div>
