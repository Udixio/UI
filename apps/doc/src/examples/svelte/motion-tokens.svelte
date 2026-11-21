<script lang="ts">
  import { defineMotion } from '@udixio/motion';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  // A spring token: the fast spatial spring moves the panel.
  defineMotion('panel-in', {
    verb: 'appear',
    keyframes: [
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0 },
    ],
    timing: 'spring.fast.spatial',
  });

  // A curve: a duration token and an easing token, in place of a spring.
  defineMotion('banner-in', {
    verb: 'appear',
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    timing: { duration: 'duration.medium2', easing: 'easing.standard' },
  });

  let open = $state(true);
</script>

<div class="flex flex-col items-start gap-4">
  {#if open}
    <!-- transition:presence keeps each element until its exit has played, then Svelte removes it. -->
    <div {@attach motion('panel-in')} transition:presence>Moves on a spring</div>
    <div {@attach motion('banner-in')} transition:presence>Fades on a curve</div>
  {/if}
  <Button size="small" label={open ? 'Hide' : 'Show'} onclick={() => (open = !open)} />
</div>
