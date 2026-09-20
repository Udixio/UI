<script lang="ts">
  import { Search } from '@udixio/ui-svelte';

  const documents = ['Button', 'Card', 'Menu', 'Search', 'Text field'];
  let query = $state('');
  let submitted = $state('');
  const results = $derived(
    documents.filter((document) => document.toLowerCase().includes(query.trim().toLowerCase())),
  );
</script>

<div class="flex w-full flex-col items-center gap-3">
  <Search label="Search documentation" placeholder="Search components" bind:query onSearch={(value) => (submitted = value)}>
    {#each results as result (result)}
      <div role="option" aria-selected={false} tabindex={-1} class="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]">
        {result}
      </div>
    {/each}
  </Search>
  <p class="text-body-small text-on-surface-variant">{submitted ? `Submitted: ${submitted}` : 'Press Enter to submit'}</p>
</div>
