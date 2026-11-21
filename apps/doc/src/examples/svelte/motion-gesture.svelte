<script lang="ts">
  import { defineGesture } from '@udixio/motion/gesture';
  import { Button, motion, motionGesture } from '@udixio/ui-svelte';

  // Reorder: the move is prevented, and the state moves the task, so Svelte renders the new order and the layout animates it.
  defineGesture('reorder', {
    type: 'reorder',
    alternative: 'grab',
  });
  // Swipe: the card flies out and is aria-hidden; the state counts it. Delete does the same on the focused card.
  defineGesture('complete', {
    type: 'swipe',
    alternative: 'action',
  });

  const TASKS = ['Reply to the design review', 'Ship the release notes', 'Book the room for Friday'];

  let tasks = $state([...TASKS]);
  let round = $state(0);
  let swiped = $state(0);

  function move(from: number, to: number) {
    const next = [...tasks];
    const [task] = next.splice(from, 1);
    next.splice(to, 0, task);
    tasks = next;
  }

  function onReorder(event: CustomEvent<{ from: number; to: number }>) {
    event.preventDefault();
    move(event.detail.from, event.detail.to);
  }
</script>

<div class="flex w-full max-w-88 flex-col items-start gap-4">
  <ul class="flex w-full flex-col gap-2">
    {#each tasks as task (task)}
      <li
        class="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
        {@attach motion('reflow')}
        {@attach motionGesture('reorder', () => ({
          onReorder,
        }))}
      >
        {task}
      </li>
    {/each}
  </ul>
  {#key round}
    <!-- A new round renders the card again: a swiped card stays aria-hidden until the page removes it. -->
    <div
      class="cursor-grab rounded-2xl bg-tertiary-container px-4 py-3 text-title-small text-on-tertiary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      {@attach motionGesture('complete', () => ({ onSwipe: () => (swiped += 1) }))}
    >
      Send the invoice
    </div>
  {/key}
  <p class="text-body-medium text-on-surface-variant">Swiped away: {swiped}</p>
  <Button
    size="small"
    label="Restore"
    onclick={() => {
      tasks = [...TASKS];
      round += 1;
      swiped = 0;
    }}
  />
</div>
