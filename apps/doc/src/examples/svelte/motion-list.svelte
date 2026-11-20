<script module lang="ts">
  import { defineMotion } from '@udixio/motion';
  import '@udixio/motion/presets';

  // Messages that enter in the same update start one step apart, from the first.
  // A leaving message is taken out of the flow, so its neighbours close the gap.
  defineMotion('inbox', {
    verb: 'appear',
    keyframes: [
      { opacity: 0, y: -16, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1 },
    ],
    stagger: 'normal',
    origin: 'first',
    exit: 'out-of-flow',
  });
</script>

<script lang="ts">
  import { Button, motion, presence } from '@udixio/ui-svelte';

  const TEXTS = ['Mo: deploy finished', 'Ines: new comment', 'Kai: release is ready'];

  let items = $state([
    { id: 1, text: 'Ada: your build passed' },
    { id: 2, text: 'Lin: review requested' },
  ]);
  let lastId = 2;

  function addThree() {
    const three = TEXTS.map((text) => ({ id: ++lastId, text }));
    // Added in one update: the three cascade in, and past five the oldest leave.
    items = [...three, ...items].slice(0, 5);
  }

  function dismiss(id: number) {
    // `presence` keeps the element until its exit has played, then Svelte removes it.
    items = items.filter((item) => item.id !== id);
  }
</script>

<div class="flex w-full max-w-80 flex-col items-start gap-4">
  <Button size="small" label="Add three" onclick={addThree} />
  <!-- out-of-flow takes a leaving message out of the flow: the list must be positioned. -->
  <ul class="relative flex w-full flex-col gap-2">
    {#each items as item (item.id)}
      <li {@attach motion('inbox reflow')}
        transition:presence>
        <div class="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high py-2 pl-4 pr-2">
          <span class="min-w-0 text-body-large text-on-surface">{item.text}</span>
          <Button variant="text" size="small" label="Dismiss" onclick={() => dismiss(item.id)} />
        </div>
      </li>
    {/each}
  </ul>
</div>
