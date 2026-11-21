<script lang="ts">
  import { defineMotion, getMotion } from '@udixio/motion';
  import { revert } from '@udixio/motion/scope';
  import { Button, motion } from '@udixio/ui-svelte';

  // A reveal can be replaced only by a reveal: a presence such as `fade` would be ignored on a rise.
  defineMotion('fade-on-view', {
    verb: 'reveal',
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  });

  let section: HTMLElement;

  function replay() {
    for (const card of section.querySelectorAll('article')) getMotion(card)?.play();
  }
</script>

<section bind:this={section} class="flex flex-col gap-3">
  <article {@attach motion('rise')}>Plain</article>
  <article {@attach motion('rise')} class="md:motion-[fade-on-view]">Fades from md</article>
  <article {@attach motion('rise')} class="motion-none">Off</article>
  <div class="flex flex-wrap gap-2">
    <Button size="small" label="Replay" onclick={replay} />
    <!-- The motions under the section stop; its markup stays. -->
    <Button size="small" variant="outlined" label="Remove the motions" onclick={() => revert(section)} />
  </div>
</section>
