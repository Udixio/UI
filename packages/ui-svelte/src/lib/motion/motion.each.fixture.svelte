<script lang="ts">
  import { motion, presence } from './motion.attachment.svelte';

  // Keyed items, each with a presence: an item removed from the list plays its exit before it leaves the DOM.
  let { items, shown = true }: { items: { id: number }[]; shown?: boolean } = $props();
</script>

<ul>
  {#each items as item (item.id)}
    <li data-testid="item" data-item={item.id} {@attach motion('fade')} transition:presence>{item.id}</li>
  {/each}
</ul>
{#if shown}
  <p data-testid="if-box" {@attach motion('fade')} transition:presence>if</p>
{/if}
