<script lang="ts">
  import Badge from './Badge.svelte';
  import type { SvelteBadgeProps } from './badge.types';

  let { child = 'icon', ...badge }: Omit<SvelteBadgeProps, 'children'> & { child?: 'icon' | 'button' } = $props();
</script>

<Badge {...badge}>
  {#if child === 'button'}
    <button>Inbox</button>
  {:else}
    <i data-testid="icon"></i>
  {/if}
</Badge>
