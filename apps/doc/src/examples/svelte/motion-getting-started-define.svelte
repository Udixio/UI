<script lang="ts">
  import { defineMotion } from '@udixio/motion';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  // Defined once, by name, before the element attaches it: the card is attached to it by that name.
  defineMotion('card-enter', {
    verb: 'appear',
    keyframes: [
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0 },
    ],
    timing: 'spring.default.spatial',
  });

  let open = $state(true);
</script>

<div class="flex flex-col items-start gap-4">
  {#if open}
    <!-- transition:presence keeps the card until its exit has played, then Svelte removes it. -->
    <div {@attach motion('card-enter')} transition:presence>Fades in and rises</div>
  {/if}
  <Button size="small" label={open ? 'Hide' : 'Show'} onclick={() => (open = !open)} />
</div>
