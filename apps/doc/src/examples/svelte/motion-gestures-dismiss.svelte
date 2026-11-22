<script lang="ts">
  import { defineGesture } from '@udixio/motion/gesture';
  import { motion, motionGesture } from '@udixio/ui-svelte';
  import '@udixio/motion/presets';

  // A swipe flies the task out, hidden from assistive
  // technology. Keep afterFlyOut at its default, hide:
  // Svelte removes the task. A focused task hands the
  // focus to the next task as it flies out, by itself.
  defineGesture('dismiss', { type: 'swipe' });

  let tasks = $state(['Reply to the design review', 'Ship the release notes', 'Book the room for Friday']);
</script>

<ul class="flex w-full max-w-88 flex-col gap-2">
  {#each tasks as task (task)}
    <!-- reflow closes the gap that a removed task leaves; the swipe completes the task, and onSwipe removes it. -->
    <li
      class="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      {@attach motion('reflow')}
      {@attach motionGesture('dismiss', () => ({
        onSwipe: () => {
          tasks = tasks.filter((item) => item !== task);
        },
      }))}
    >
      {task}
    </li>
  {/each}
</ul>
