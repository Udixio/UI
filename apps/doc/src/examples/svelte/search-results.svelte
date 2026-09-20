<script lang="ts">
  import { Search } from '@udixio/ui-svelte';

  type ResultState = 'results' | 'empty' | 'loading' | 'error';
  const results = ['Material Search', 'Search guidelines', 'Search accessibility'];
  const stateLabels: Record<ResultState, string> = {
    results: 'Results available',
    empty: 'No results',
    loading: 'Loading results',
    error: 'Unable to load results',
  };
  let query = $state('search');
  let state = $state<ResultState>('results');
</script>

<div class="flex w-full flex-col gap-4">
  <div class="flex flex-wrap gap-2" role="group" aria-label="Result state">
    {#each Object.keys(stateLabels) as resultState}
      <button
        type="button"
        aria-pressed={state === resultState}
        class="rounded-full bg-surface-container-high px-3 py-2 text-label-medium text-on-surface hover:bg-on-surface/[0.08]"
        onclick={() => (state = resultState as ResultState)}
      >{resultState}</button>
    {/each}
  </div>
  <Search label="Remote documentation search" bind:query defaultExpanded resultsLabel="Remote search results" onSearch={() => (state = 'loading')}>
    {#if state === 'results'}
      {#each results as result (result)}
        <div role="option" aria-selected={false} tabindex={-1} class="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]">{result}</div>
      {/each}
    {:else}
      <div role="option" aria-selected={false} aria-disabled="true" aria-live="polite" tabindex={-1} class="px-4 py-3 text-body-medium text-on-surface-variant">
        {stateLabels[state]}
      </div>
    {/if}
  </Search>
  <p class="text-body-small text-on-surface-variant" role="status">Consumer-managed state: {stateLabels[state]}</p>
</div>
