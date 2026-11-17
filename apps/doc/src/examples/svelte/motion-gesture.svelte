<script lang="ts">
  import { defineGesture } from '@udixio/motion/gesture';
  import { motionGesture } from '@udixio/ui-svelte';

  // A swipe: released far or fast enough, the item flies out. Delete or Backspace does the same on the focused item.
  defineGesture('notification-dismiss', { kind: 'swipe', alternative: 'action' });

  let round = $state(0);
  let swiped = $state(0);
</script>

<div class="flex flex-col items-start gap-4">
  <p class="text-body-large text-on-surface">Swiped away: {swiped}</p>
  {#key round}
    <ul class="flex w-72 flex-col gap-2">
      {#each [1, 2, 3] as n (n)}
        <li
          {@attach motionGesture('notification-dismiss', () => ({ onSwipe: () => (swiped += 1) }))}
          class="rounded-xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface"
        >
          Notification {n}
        </li>
      {/each}
    </ul>
  {/key}
  <button
    type="button"
    onclick={() => {
      round += 1;
      swiped = 0;
    }}
    class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
  >
    Restore
  </button>
</div>
