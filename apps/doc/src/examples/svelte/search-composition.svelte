<script lang="ts">
  import { Button, Search, SideSheet } from '@udixio/ui-svelte';

  const filters = ['Components', 'Guides', 'API reference'];
  let open = $state(false);
</script>

<div class="flex w-full flex-col items-center gap-4">
  <Search label="Inline documentation search" />
  <Button label="Open search in a modal surface" onclick={() => (open = true)} />
  <SideSheet variant="modal" title="Search documentation" bind:open class="w-[calc(100vw-2rem)] max-w-none sm:w-96">
    <div class="p-4">
      <Search label="Filter documentation" defaultExpanded>
        {#each filters as filter (filter)}
          <div role="option" aria-selected={false} tabindex={-1} class="rounded-xl px-4 py-3 text-body-large hover:bg-on-surface/[0.08]">
            {filter}
          </div>
        {/each}
      </Search>
    </div>
  </SideSheet>
  <p class="text-body-small text-on-surface-variant" role="status">{open ? 'Modal search is open' : 'Modal search is closed'}</p>
</div>
