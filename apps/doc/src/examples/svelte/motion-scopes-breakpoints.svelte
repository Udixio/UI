<script lang="ts">
  import { defineMotion } from '@udixio/motion';
  import { motion } from '@udixio/ui-svelte';

  // Only a reveal can replace a rise: not a presence.
  defineMotion('fade-on-view', {
    verb: 'reveal',
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  });
</script>

<section class="flex flex-col gap-3">
  <article {@attach motion('rise')}>Plain</article>
  <article {@attach motion('rise')} class="md:motion-[fade-on-view]">Fades from md</article>
  <article {@attach motion('rise')} class="motion-none">Off</article>
</section>
