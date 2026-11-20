<script lang="ts">
  import { defineMotion } from '@udixio/motion';
  import { motion, presence } from '@udixio/ui-svelte';

  defineMotion('pop', {
    verb: 'appear',
    keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }],
  });
  let open = $state(true);
</script>

<button onclick={() => (open = !open)}>Toggle</button>
{#if open}
  <p {@attach motion('pop')} transition:presence>Saved to your library</p>
{/if}
