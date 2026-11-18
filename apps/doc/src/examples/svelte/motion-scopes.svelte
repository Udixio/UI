<script lang="ts">
  import { defineMotion, getMotion } from '@udixio/motion';
  import { revert } from '@udixio/motion/scope';
  import { motion } from '@udixio/ui-svelte';

  // A reveal names a reveal: a presence such as `fade` would be ignored on a rise.
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
  <article
    {@attach motion('rise')}
    class="md:[--udx-motion:fade-on-view]"
  >Fades from md</article>
  <article {@attach motion('rise')} class="[--udx-motion:none]">Off</article>
  <button type="button" onclick={replay}>Replay</button>
  <!-- The motions under the section stop; its markup stays. -->
  <button type="button" onclick={() => revert(section)}>Remove the motions</button>
</section>
