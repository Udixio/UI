<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  // Each message is a presence and a layout: it enters and leaves with the cascade, and the messages around it follow.
  let messages = $state([
    { id: 1, text: 'Ada: your build passed' },
    { id: 2, text: 'Lin: review requested' },
  ]);
  let lastId = 2;

  function addTwo() {
    // Added in one update: the two cascade in, above the others.
    const two = [
      { id: ++lastId, text: 'Mo: deploy finished' },
      { id: ++lastId, text: 'Kai: release is ready' },
    ];
    messages = [...two, ...messages];
  }

  function dismiss(id: number) {
    // presence keeps the message until its exit has played, then Svelte removes it.
    messages = messages.filter((message) => message.id !== id);
  }
</script>

<div class="flex flex-col items-start gap-4">
  <Button size="small" label="Add two" onclick={addTwo} />
  <ul class="flex w-full flex-col gap-2">
    {#each messages as message (message.id)}
      <li
        {@attach motion('cascade reflow')}
        transition:presence
        class="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high py-2 pl-4 pr-2"
      >
        <span class="min-w-0 text-body-large text-on-surface">{message.text}</span>
        <Button variant="text" size="small" label="Dismiss" onclick={() => dismiss(message.id)} />
      </li>
    {/each}
  </ul>
</div>
