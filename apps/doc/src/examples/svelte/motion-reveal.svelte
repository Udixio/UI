<script lang="ts">
  import '@udixio/motion/presets';
  import { motion } from '@udixio/ui-svelte';

  const TITLES = ['Release notes', 'Design review', 'Build passed', 'New comment', 'Room booked', 'Invoice sent'];
</script>

<ol tabindex="0" aria-label="Feed" class="flex h-64 w-full max-w-[22rem] flex-col gap-2 overflow-y-auto rounded-2xl bg-surface-container p-3">
  <!-- A card rises once, as it enters the view of the feed: until then it waits in its first frame. -->
  {#each TITLES as title (title)}
    <li
      {@attach motion('rise')}
      class="rounded-2xl bg-surface-container-high px-4 py-3 text-title-small text-on-surface"
    >
      {title}
    </li>
  {/each}
</ol>
