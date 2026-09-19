<script lang="ts">
  import Card from './Card.svelte';
  import type { SvelteCardProps } from './card.types';

  let { text = 'Body', ...card }: Omit<SvelteCardProps, 'children'> & { text?: string } = $props();
</script>

<Card {...card}><p>{text}</p></Card>
